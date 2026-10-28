"""
LiveKit Voice Interviewer Agent Worker.

Lifecycle Overview:
-------------------
1. Room created: Candidate calls POST /api/attempts/{id}/start -> room 'attempt-<id>' is created.
2. Job dispatched: LiveKit Cloud dispatches a job to this worker process.
3. Entrypoint (@server.rtc_session):
   - Reads ctx.room.name and extracts attempt_id.
   - Creates its OWN PyMongo AsyncMongoClient (the agent runs in its own event loop).
   - Loads the attempt document; verifies status is 'in_progress'.
   - Dynamically builds the system instructions using build_interviewer_instructions().
   - Connects AgentSession with STT (Whisper Large Turbo), LLM (Groq), TTS (Deepgram Aura).
   - Agent speaks first greeting the candidate and asking Question 1.
4. Real-time transcript saving:
   - Listens to 'conversation_item_added' events.
   - Spawns an async task to $push every spoken message to MongoDB immediately.
5. Interview completion rules:
   - Tracks candidate answers. When candidate answers all questions, the subsequent
     interviewer message is the closing goodbye.
   - When closing words are recorded, calls session.shutdown(drain=True).
   - A background timer enforces time_limit_min.
6. Shutdown callback:
   - Records ended_at.
   - Marks status as 'completed' (if candidate answered all questions) or 'abandoned'.
   - If completed, invokes score_attempt(db, attempt_id) to evaluate the candidate.
   - Closes the agent's MongoDB client connection.

Known limitation:
TODO: A candidate who refreshes mid-call cannot rejoin; the recruiter uses "reset".
"""

import asyncio
import logging
from typing import Any, Optional
from dotenv import load_dotenv
from bson import ObjectId
from pymongo import AsyncMongoClient
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobExecutorType,
    JobProcess,
    cli,
    room_io,
)
from livekit.plugins import deepgram, groq, silero

from config.settings import (
    MONGODB_URI,
    MONGODB_DB_NAME,
    INTERVIEWER_LLM_MODEL,
)
from models import attempt_model
from services import scoring_service
from utils.constants import STATUS_IN_PROGRESS, STATUS_COMPLETED, STATUS_ABANDONED
from utils.helpers import to_object_id, now_utc
from utils.interviewer_prompt import build_interviewer_instructions

# The agents CLI does not load .env on its own.
load_dotenv()

logger = logging.getLogger("hireup-agent")
logging.basicConfig(level=logging.INFO)


# Low-memory worker settings tuned for Render Free Tier (512 MB RAM).
# num_idle_processes=0: No idle process is kept pre-warmed. A new process is
# forked only when a LiveKit job arrives. This saves ~150 MB of idle RAM that
# would otherwise hold the Silero ONNX model and livekit-agents runtime.
# The trade-off is ~1-2 s extra latency on the very first interview of the day
# while the process forks and loads the VAD model.
server = AgentServer(
    job_executor_type=JobExecutorType.PROCESS,
    num_idle_processes=0,
    load_threshold=float("inf"),
)


def prewarm(proc: JobProcess) -> None:
    """Preloads Silero VAD into process memory before the session starts."""
    proc.userdata["vad"] = silero.VAD.load(
        min_silence_duration=0.4,    # 0.4s quiet after speech to end a turn
        min_speech_duration=0.05,    # Ignore noise bursts shorter than 50ms
        activation_threshold=0.5,    # Standard sensitivity
    )


server.setup_fnc = prewarm


@server.rtc_session()
async def entrypoint(ctx: JobContext) -> None:
    """
    Main job handler executed when a candidate joins an interview room.
    """
    room_name = ctx.room.name
    logger.info("Agent received job for room: %s", room_name)

    # Step 1: Extract attempt_id from room name (format: 'attempt-<attempt_id>')
    if not room_name.startswith("attempt-"):
        logger.warning("Room %s does not follow 'attempt-<id>' format. Exiting.", room_name)
        return

    attempt_id_str = room_name.replace("attempt-", "")
    attempt_id: Optional[ObjectId] = to_object_id(attempt_id_str)
    if attempt_id is None:
        logger.warning("Invalid ObjectId in room name %s. Exiting.", room_name)
        return

    # Step 2: Create a DEDICATED AsyncMongoClient for this worker thread/loop
    # The voice agent runs in a different thread/loop than FastAPI.
    # Therefore, it must instantiate its own database connection rather than sharing the API client.
    agent_mongo_client: AsyncMongoClient = AsyncMongoClient(MONGODB_URI)
    db = agent_mongo_client[MONGODB_DB_NAME]

    # Step 3: Fetch attempt document and verify status
    attempt_doc = await attempt_model.find_attempt_by_id_only(db, attempt_id)
    if attempt_doc is None:
        logger.warning("Attempt %s not found in database. Exiting.", attempt_id_str)
        await agent_mongo_client.close()
        return

    current_status = attempt_doc.get("status")
    if current_status != STATUS_IN_PROGRESS:
        logger.warning("Attempt %s is in status '%s', expected 'in_progress'. Exiting.", attempt_id_str, current_status)
        await agent_mongo_client.close()
        return

    company_name = attempt_doc.get("company_name", "Company")
    interview_title = attempt_doc.get("interview_title", "Technical Interview")
    questions = attempt_doc.get("questions_snapshot", [])
    total_questions = len(questions)
    time_limit_min = attempt_doc.get("time_limit_min", 30)

    # Step 4: Build dynamic prompt instructions
    instructions_text = build_interviewer_instructions(
        company_name=company_name,
        interview_title=interview_title,
        questions=questions,
    )

    class DynamicInterviewer(Agent):
        def __init__(self) -> None:
            super().__init__(instructions=instructions_text)

    # Step 5: Configure voice pipeline session
    #
    # Tuning notes for Render Free Tier (0.1 vCPU, 512 MB RAM):
    # - TTS: aura-2-athena-en default 24kHz opus – do NOT force 48kHz linear16;
    #   that pushes 768 kbps of uncompressed PCM which saturates the CPU and
    #   causes the first few words to arrive corrupted / broken.
    # - Endpointing: 0.5s min is responsive but not hair-trigger; 4.0s max
    #   gives candidates time to think on hard questions without the agent
    #   cutting in. Lower values than 0.5s cause false endpoints under CPU load.
    # - min_consecutive_speech_delay: keep low (0.8s) so Q+A transitions feel natural.
    session = AgentSession(
        vad=ctx.proc.userdata["vad"],
        stt=groq.STT(model="whisper-large-v3-turbo", language="en"),
        llm=groq.LLM(model=INTERVIEWER_LLM_MODEL),
        tts=deepgram.TTS(
            model="aura-2-athena-en",  # Clear professional voice; uses default 24kHz opus
            # No sample_rate / encoding overrides: default opus at 24kHz uses ~32 kbps
            # instead of 768 kbps for linear16 @ 48kHz — critical on free-tier CPU
        ),
        min_endpointing_delay=0.5,        # 0.5s of silence triggers end-of-turn
        max_endpointing_delay=4.0,        # Allow up to 4s thinking pause
        min_consecutive_speech_delay=0.8, # 0.8s gap between agent utterances
    )

    # State tracking variables
    candidate_answer_count = 0
    interviewer_question_count = 0  # tracks how many questions the interviewer has asked
    waiting_for_answer = False      # True after interviewer asks, False after first candidate segment
    interview_completed = False
    time_limit_task: Optional[asyncio.Task] = None
    heartbeat_task: Optional[asyncio.Task] = None  # periodic status check
    transcript_tasks: set[asyncio.Task] = set()  # track transcript save tasks
    last_activity_time = asyncio.get_event_loop().time()  # track when last conversation item was added

    # Step 6: Listen for conversation items to save transcripts in real-time
    #
    # IMPORTANT: A candidate may speak in multiple speech segments for a single
    # answer (e.g. pausing to think mid-sentence). Each segment fires a separate
    # 'conversation_item_added' event.  We must count ONE answer per question,
    # not one per speech segment.  The `waiting_for_answer` flag handles this:
    #   - Set to True when the interviewer speaks (asks a question)
    #   - Set to False on the FIRST candidate segment that follows
    #   - Only that first segment increments candidate_answer_count
    def on_conversation_item_added(event: Any) -> None:
        nonlocal candidate_answer_count, interviewer_question_count
        nonlocal waiting_for_answer, interview_completed, last_activity_time

        item = getattr(event, "item", None)
        if item is None:
            return

        role_raw = getattr(item, "role", "")
        # Map assistant -> interviewer, user -> candidate
        role = "interviewer" if role_raw == "assistant" else "candidate"

        text_content = getattr(item, "text_content", "") or ""
        clean_text = text_content.strip()
        if len(clean_text) == 0:
            return

        # Update last activity time
        last_activity_time = asyncio.get_event_loop().time()

        # Track transcript save task so we can await it on shutdown
        task = asyncio.create_task(
            attempt_model.append_transcript_message(
                db=db,
                attempt_id=attempt_id,
                role=role,
                text=clean_text,
            )
        )
        transcript_tasks.add(task)
        task.add_done_callback(transcript_tasks.discard)

        if role == "interviewer":
            interviewer_question_count += 1
            waiting_for_answer = True  # expect the next candidate speech to be an answer
            logger.info("Interviewer turn %d / %d", interviewer_question_count, total_questions + 1)

            # SAFETY CHECK: Detect if LLM output multiple questions in one response
            # Count question marks and question-like phrases
            question_mark_count = clean_text.count("?")
            question_phrases = ["question", "what", "how", "why", "when", "where", "which", "who", "is it", "does it", "can you"]
            phrase_count = sum(1 for phrase in question_phrases if phrase.lower() in clean_text.lower())

            # If detected multiple questions (more than 1 question mark or multiple question phrases), log warning
            if question_mark_count > 1 or (question_mark_count >= 1 and phrase_count > 2):
                logger.warning(
                    "LLM may have output multiple questions in one turn (question marks: %d, phrases: %d). Text: %s",
                    question_mark_count, phrase_count, clean_text[:100]
                )

            # Detect farewell signals to properly end the interview
            # These are specific phrases that only the interviewer should say when closing
            farewell_signals = ["wraps up our interview", "thank you for taking the time to speak with",
                                "our team will review", "reach out regarding next steps", "have a great day, goodbye"]
            text_lower = clean_text.lower()
            has_farewell = any(signal in text_lower for signal in farewell_signals)

            # Only end if farewell is detected AND we have received all answers
            if has_farewell and candidate_answer_count >= total_questions:
                interview_completed = True
                logger.info(
                    "Farewell detected after all answers (answers %d/%d). Shutting down.",
                    candidate_answer_count, total_questions,
                )
                session.shutdown(drain=True)
                return

        elif role == "candidate":
            # Only count the FIRST candidate segment after an interviewer question.
            # Subsequent segments (candidate continuing their answer) are ignored
            # for counting purposes but still saved to the transcript above.
            if waiting_for_answer:
                waiting_for_answer = False
                candidate_answer_count += 1
                logger.info("Candidate answer %d / %d received", candidate_answer_count, total_questions)

    session.on("conversation_item_added", on_conversation_item_added)

    # Step 7: Time limit watcher task
    async def enforce_time_limit() -> None:
        seconds_to_wait = time_limit_min * 60
        try:
            await asyncio.sleep(seconds_to_wait)
            logger.info("Time limit reached (%d min). Concluding interview.", time_limit_min)
            session.shutdown(drain=True)
        except asyncio.CancelledError:
            pass

    time_limit_task = asyncio.create_task(enforce_time_limit())

    # Step 7.5: Heartbeat task to detect truly abandoned interviews
    # Runs every 60 seconds. On Render Free Tier (shared 0.1 vCPU), Silero VAD
    # inference can lag 10-30s under CPU contention; we must give a generous
    # inactivity window so we do NOT falsely shut down a live interview while
    # the candidate is mid-answer and VAD is still catching up.
    async def heartbeat_monitor() -> None:
        nonlocal last_activity_time
        while not interview_completed:
            try:
                await asyncio.sleep(60)  # Check every 60 seconds
                current_time = asyncio.get_event_loop().time()
                time_since_activity = current_time - last_activity_time

                # Only consider the interview "abandoned" after 150 seconds of
                # complete silence AND we've had at least one exchange.  150s
                # is generous enough for a candidate thinking on a hard question
                # even when the CPU is at 100%.
                if time_since_activity > 150:
                    logger.warning(
                        "No conversation activity for %.0f seconds. Treating as abandoned. "
                        "Answers: %d/%d",
                        time_since_activity, candidate_answer_count, total_questions
                    )
                    if candidate_answer_count > 0:
                        logger.info("Ending interview due to prolonged inactivity.")
                        session.shutdown(drain=True)
                        break
            except asyncio.CancelledError:
                break

    heartbeat_task = asyncio.create_task(heartbeat_monitor())

    # Step 8: Shutdown callback to finalize status and trigger scoring
    async def on_shutdown() -> None:
        # Await all pending transcript saves so the last answer isn't lost
        pending = [t for t in transcript_tasks if not t.done()]
        if pending:
            logger.info("Awaiting %d pending transcript save(s)...", len(pending))
            await asyncio.gather(*pending, return_exceptions=True)

        if time_limit_task is not None and not time_limit_task.done():
            time_limit_task.cancel()

        if heartbeat_task is not None and not heartbeat_task.done():
            heartbeat_task.cancel()

        logger.info("Session shutting down for attempt %s", attempt_id_str)
        try:
            # Check if all questions were answered
            if candidate_answer_count >= total_questions:
                final_status = STATUS_COMPLETED
            else:
                final_status = STATUS_ABANDONED

            # Update status in MongoDB
            updated_doc = await attempt_model.finish_attempt_session(
                db=db,
                attempt_id=attempt_id,
                final_status=final_status,
            )

            if updated_doc is None:
                logger.error("Failed to update attempt status during shutdown. Document may be locked.")
                # Force update as a fallback - update without status check
                current_time = now_utc()
                await db["attempts"].update_one(
                    {"_id": attempt_id},
                    {"$set": {"status": final_status, "ended_at": current_time}}
                )
                logger.info("Forced status update completed as fallback.")

            # If completed, invoke automated scoring
            if final_status == STATUS_COMPLETED:
                logger.info("Attempt completed. Running scoring service...")
                try:
                    await scoring_service.score_attempt(db, attempt_id)
                    logger.info("Scoring completed successfully.")
                except Exception as score_exc:
                    logger.error("Scoring failed for attempt %s: %s", attempt_id_str, str(score_exc))
        except Exception as shutdown_exc:
            logger.error("Error during shutdown: %s", str(shutdown_exc))
            # Ensure we still try to mark as abandoned if shutdown fails
            try:
                current_time = now_utc()
                await db["attempts"].update_one(
                    {"_id": attempt_id},
                    {"$set": {"status": STATUS_ABANDONED, "ended_at": current_time}}
                )
                logger.info("Emergency status update completed.")
            except Exception as emergency_exc:
                logger.error("Emergency status update also failed: %s", str(emergency_exc))
        finally:
            await agent_mongo_client.close()
            logger.info("Agent Mongo client closed.")

    ctx.add_shutdown_callback(on_shutdown)

    # Step 9: Connect to LiveKit room and wait for candidate participant
    #
    # CRITICAL: session.start() fires job_ctx.connect() as a background asyncio task,
    # meaning it may not be complete when generate_reply() runs immediately after.
    # If the candidate's audio track is not yet subscribed, Silero VAD never receives
    # frames → the agent speaks Q1 but then sits deaf forever.
    #
    # Fix: explicitly await ctx.connect() THEN wait_for_participant() BEFORE starting
    # the session. This ensures:
    #   1. The WebRTC ICE/DTLS handshake is fully established
    #   2. The candidate's audio track is visible and auto-subscribed
    #   3. RoomIO can wire VAD input immediately when session.start() runs
    await ctx.connect()
    logger.info("Room connected for attempt %s. Waiting for candidate participant...", attempt_id_str)
    await ctx.wait_for_participant()  # blocks until candidate's audio track is subscribed
    logger.info("Candidate participant ready. Starting agent session.")

    # Step 10: Start session (room already connected above)
    await session.start(
        room=ctx.room,
        agent=DynamicInterviewer(),
        room_options=room_io.RoomOptions(delete_room_on_close=True),
    )

    # Step 11: Agent speaks first: Introduction + Question 1
    await session.generate_reply(
        instructions=(
            f"Welcome the candidate warmly. Introduce yourself as the AI interviewer from {company_name}. "
            f"Tell them this interview is for the {interview_title} position and there will be {total_questions} questions. "
            "Encourage them to take their time. Then ask Question 1."
        )
    )


if __name__ == "__main__":
    # -------------------------------------------------------------------------
    # Render Web Service compatibility: bind a tiny health-check HTTP server
    # to $PORT before starting the agent worker.
    #
    # Render free-tier Web Services require the process to listen on $PORT
    # within 60 seconds or the deploy is marked failed.  The livekit-agents
    # CLI does not expose HTTP, so we start a minimal stdlib HTTP server in a
    # daemon thread (zero extra dependencies needed).
    # -------------------------------------------------------------------------
    import http.server
    import threading

    _port = int(os.getenv("PORT", 0))
    if _port > 0:
        class _HealthHandler(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                body = b'{"status": "agent-running"}'
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

            def log_message(self, *args):  # suppress HTTP access logs
                pass

        _health_srv = http.server.HTTPServer(("0.0.0.0", _port), _HealthHandler)
        threading.Thread(target=_health_srv.serve_forever, daemon=True).start()
        logger.info(
            "Health server ready on port %d (Render Web Service compatibility)",
            _port,
        )

    cli.run_app(server)