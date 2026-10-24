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
from utils.helpers import to_object_id
from utils.interviewer_prompt import build_interviewer_instructions

# The agents CLI does not load .env on its own.
load_dotenv()

logger = logging.getLogger("hireup-agent")
logging.basicConfig(level=logging.INFO)


# Low-memory worker settings tuned for small / free tier cloud instances
server = AgentServer(
    job_executor_type=JobExecutorType.THREAD,
    num_idle_processes=1,
    load_threshold=float("inf"),
)


def prewarm(proc: JobProcess) -> None:
    """Preloads Silero VAD into process memory before any call arrives."""
    proc.userdata["vad"] = silero.VAD.load()


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
    session = AgentSession(
        vad=ctx.proc.userdata["vad"],
        stt=groq.STT(model="whisper-large-v3-turbo", language="en"),
        llm=groq.LLM(model=INTERVIEWER_LLM_MODEL),
        tts=deepgram.TTS(model="aura-2-andromeda-en"),
    )

    # State tracking variables
    candidate_answer_count = 0
    interview_completed = False
    time_limit_task: Optional[asyncio.Task] = None

    # Step 6: Listen for conversation items to save transcripts in real-time
    def on_conversation_item_added(event: Any) -> None:
        nonlocal candidate_answer_count, interview_completed

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

        # Fire-and-forget task to push transcript item to MongoDB immediately
        asyncio.create_task(
            attempt_model.append_transcript_message(
                db=db,
                attempt_id=attempt_id,
                role=role,
                text=clean_text,
            )
        )

        # Count candidate answers
        if role == "candidate":
            candidate_answer_count = candidate_answer_count + 1
            logger.info("Candidate answer received: %d / %d", candidate_answer_count, total_questions)

        # If candidate answered all questions, the NEXT interviewer speech is the closing goodbye
        elif role == "interviewer" and candidate_answer_count >= total_questions:
            interview_completed = True
            logger.info("Interview concluding. Shutting down session with drain.")
            session.shutdown(drain=True)

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

    # Step 8: Shutdown callback to finalize status and trigger scoring
    async def on_shutdown() -> None:
        if time_limit_task is not None and not time_limit_task.done():
            time_limit_task.cancel()

        logger.info("Session shutting down for attempt %s", attempt_id_str)
        try:
            # Check if all questions were answered
            if candidate_answer_count >= total_questions:
                final_status = STATUS_COMPLETED
            else:
                final_status = STATUS_ABANDONED

            # Update status in MongoDB
            await attempt_model.finish_attempt_session(
                db=db,
                attempt_id=attempt_id,
                final_status=final_status,
            )

            # If completed, invoke automated scoring
            if final_status == STATUS_COMPLETED:
                logger.info("Attempt completed. Running scoring service...")
                try:
                    await scoring_service.score_attempt(db, attempt_id)
                    logger.info("Scoring completed successfully.")
                except Exception as score_exc:
                    logger.error("Scoring failed for attempt %s: %s", attempt_id_str, str(score_exc))
        finally:
            await agent_mongo_client.close()
            logger.info("Agent Mongo client closed.")

    ctx.add_shutdown_callback(on_shutdown)

    # Step 9: Start session
    await session.start(
        room=ctx.room,
        agent=DynamicInterviewer(),
        room_options=room_io.RoomOptions(delete_room_on_close=True),
    )

    # Step 10: Agent speaks first: Greeting + Question 1
    await session.generate_reply(
        instructions=(
            f"Greet the candidate in one concise sentence representing {company_name}, "
            "then ask Question 1."
        )
    )


if __name__ == "__main__":
    cli.run_app(server)