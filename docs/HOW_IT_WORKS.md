# How HireUp Works: Complete Architecture & Flow Guide

HireUp is a real-time, low-latency AI Voice Technical Interview platform designed with a clean, decoupled architecture.

---

## 1. High-Level ASCII Journey Diagram

```
+--------------------------------------------------------------------------------------------------+
|                                    1. RECRUITER SETUP                                            |
|                                                                                                  |
|   Recruiter signs in (Clerk) ---> Creates Company ---> Creates Interview (Questions & Rubric)   |
|                                                                 |                                |
|                                                                 v                                |
|                                                    Invites Candidate Emails                      |
|                                                    (Creates Attempt records)                     |
+--------------------------------------------------------------------------------------------------+
                                                |
                                                v  Candidate receives link (/interview/<attempt_id>)
+--------------------------------------------------------------------------------------------------+
|                                    2. THE START GATE                                             |
|                                                                                                  |
|   Candidate logs in with Clerk ---> Hits POST /api/attempts/<id>/start                           |
|                                           |                                                      |
|                   +-----------------------+-----------------------+                              |
|                   |                       |                       |                              |
|             Email Mismatch             Expired             Valid & Invited                       |
|                   |                       |                       |                              |
|             404 Not Found            410 Expired           Atomic find_one_and_update            |
|       (Never leaks info)                                  status: "in_progress"                  |
|                                                                   |                              |
|                                                            Mints LiveKit Token                   |
|                                                          (Scoped TTL: Limit + 5m)                |
+--------------------------------------------------------------------------------------------------+
                                                |
                                                v  Candidate joins WebRTC Room
+--------------------------------------------------------------------------------------------------+
|                                    3. REAL-TIME VOICE LOOP                                       |
|                                                                                                  |
|       Candidate Browser (Next.js) <=== WebRTC Audio ===> LiveKit Cloud                           |
|                                                                  ^                               |
|                                                                  | Audio Tracks                  |
|                                                                  v                               |
|                                                    LiveKit Worker (agent.py)                     |
|                                                      Silero VAD (Speech Detection)               |
|                                                      Groq Whisper-Large-v3-Turbo (STT)           |
|                                                      Groq OpenAI GPT-OSS-120B (LLM)              |
|                                                      Deepgram Aura-2-Andromeda (TTS)             |
|                                                                  |                               |
|                     Real-Time $push (every turn)                 v                               |
|                   ----------------------------------> MongoDB Attempt Transcript                 |
+--------------------------------------------------------------------------------------------------+
                                                |
                                                v  Candidate completes last question
+--------------------------------------------------------------------------------------------------+
|                                    4. COMPLETION & SCORING                                       |
|                                                                                                  |
|   Agent speaks goodbye ---> Shuts down session ---> status: "completed"                          |
|                                                                  |                               |
|                                                                  v                               |
|                                                    Scoring Service (Groq LLM)                    |
|                                                    Evaluates transcript against rubrics          |
|                                                    Validates with Pydantic JSON schema           |
|                                                                  |                               |
|                                                                  v                               |
|                                                    status: "scored", result saved                |
+--------------------------------------------------------------------------------------------------+
                                                |
                                                v
+--------------------------------------------------------------------------------------------------+
|                                    5. RECRUITER REVIEW                                           |
|                                                                                                  |
|   Recruiter Dashboard ---> View Candidate Attempt:                                               |
|   - Overall Score (0-10)                                                                         |
|   - Recommendation (strong_yes / yes / maybe / no)                                               |
|   - Summary, Strengths & Growth Areas                                                            |
|   - Per-question score breakdown                                                                 |
|   - Full conversation transcript                                                                 |
|   - Optional: "Re-score" or "Reset" (lets candidate retry)                                       |
+--------------------------------------------------------------------------------------------------+
```

---

## 2. File Map & Architecture

### Backend (`/backend`)
Follows the Express / MERN style layers: **Routes -> Middleware -> Controllers -> Models & Services**.

| File | Purpose | Who Calls It | What It Talks To |
| :--- | :--- | :--- | :--- |
| `main.py` | API server entry point. Configures CORS, mounts routers under `/api`, connects MongoDB at startup, and launches `agent.py` as a managed subprocess. | `uvicorn` | FastAPI, Routers, `db.py` |
| `agent.py` | LiveKit Voice Worker process. Connects to LiveKit Cloud, listens to real-time audio, drives the conversation, streams transcript turns to MongoDB, and triggers auto-scoring on completion. | Subprocess from `main.py` | LiveKit Cloud, Groq, Deepgram, Silero, `attempt_model.py`, `scoring_service.py` |
| `config/settings.py` | Validates and loads required environment variables. Raises explicit errors if any variable is missing. | All backend modules | `.env` / Environment |
| `config/db.py` | Initializes the shared `AsyncMongoClient` and creates unique/performance indexes on MongoDB collections. Provides `get_db` dependency. | `main.py`, Routes | MongoDB Atlas |
| `models/user_model.py` | Direct MongoDB operations for the `users` collection. | `auth_middleware.py`, `me_controller.py` | MongoDB `users` |
| `models/company_model.py` | Direct MongoDB operations for the `companies` collection. | `company_controller.py`, `me_controller.py` | MongoDB `companies` |
| `models/interview_model.py` | Direct MongoDB operations for creating and finding interview templates. | `interview_controller.py` | MongoDB `interviews` |
| `models/attempt_model.py` | Direct MongoDB queries for candidate invitations, atomic start gate (`start_attempt_if_allowed`), real-time transcript appending, session termination, and score saving. | Controllers, `agent.py`, `scoring_service.py` | MongoDB `attempts` |
| `middleware/auth_middleware.py` | Verifies Clerk session JWTs, fetches verified emails, upserts user records, and enforces company ownership (`require_company_user`). | Route dependencies | Clerk Backend SDK, `user_model.py` |
| `services/clerk_service.py` | Communicates with Clerk's Backend API using the official SDK. Authenticates requests and extracts verified email addresses. | `auth_middleware.py` | Clerk API |
| `services/livekit_service.py` | Mints short-lived LiveKit access tokens scoped to `attempt-<id>`. | `candidate_controller.py` | `livekit-api` |
| `services/scoring_service.py` | Evaluates interview transcripts using Groq, validates with strict Pydantic schemas, and saves scores. | `agent.py`, `attempt_controller.py` | Groq API, `attempt_model.py` |
| `utils/interviewer_prompt.py` | Builds the system prompt for the voice interviewer using company name, role title, and question snapshot. | `agent.py` | Python string formatting |

### Frontend (`/frontend`)
Next.js 14 App Router application with Tailwind CSS and LiveKit React Components.

| File | Purpose |
| :--- | :--- |
| `app/layout.tsx` | Root layout with ClerkProvider, navigation header (Recruiter Dashboard / My Interviews / Auth buttons). |
| `middleware.ts` | Route guard protecting `/dashboard`, `/my-interviews`, and `/interview` using Clerk. |
| `lib/api.ts` | Centralized typed HTTP client with automatic Clerk JWT Bearer header attachment and error extraction. |
| `app/page.tsx` | Landing page explaining the platform with sign-in and navigation links. |
| `app/dashboard/page.tsx` | Recruiter dashboard: company setup form, interview creation form (with `Question || Rubric` parser), and interview list with status counts. |
| `app/dashboard/interviews/[id]/page.tsx` | Recruiter interview details: candidate invite textarea (bulk paste), attempts table, copy link, and attempt reset. |
| `app/dashboard/attempts/[id]/page.tsx` | Recruiter candidate review: score badge, recommendation, strengths/weaknesses, per-question breakdown, and full conversation transcript. |
| `app/my-interviews/page.tsx` | Candidate portal: lists all interviews assigned to the user's verified Clerk emails without exposing scores or internal notes. |
| `app/interview/[attemptId]/page.tsx` | Voice room: consent notice, calls start gate, embeds `<LiveKitRoom>`, dual `<BarVisualizer>`, and `<ControlBar>`. |

---

## 3. Core Concepts Glossary

- **Clerk Session Token**: A cryptographically signed JSON Web Token (JWT) issued by Clerk to the browser upon signing in. It verifies identity to our FastAPI backend.
- **Authorized Parties (`azp`)**: Security rule that ensures the session token was actually minted for our frontend application origin (`http://localhost:3000`), rejecting stolen tokens from other domains.
- **LiveKit Room**: A virtual WebRTC room on LiveKit Cloud. Audio tracks published by the candidate and agent are mixed and routed in real time with sub-100ms latency.
- **Agent Worker (`agent.py`)**: A Python background process running LiveKit Agents. It listens for room connections and runs the AI voice pipeline.
- **VAD (Voice Activity Detection)**: Silero VAD detects when speech starts and stops locally in memory without needing continuous cloud API calls.
- **STT (Speech-to-Text)**: Groq Whisper-Large-v3-Turbo converts candidate spoken audio into text in milliseconds.
- **LLM (Large Language Model)**: Groq's high-speed inference engine (`openai/gpt-oss-120b`) generates the interviewer's next spoken lines and scores completed transcripts.
- **TTS (Text-to-Speech)**: Deepgram Aura converts LLM text into realistic, expressive human speech audio.
- **Atomic Update (`find_one_and_update`)**: A database operation that checks conditions and updates a record in a single indivisible step in MongoDB. Prevents double-starting if a candidate clicks start in two tabs simultaneously.
- **MongoDB ObjectId**: A unique 12-byte BSON identifier used as the primary key (`_id`) for documents in MongoDB.
