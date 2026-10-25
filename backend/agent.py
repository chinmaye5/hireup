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
    proc.userdata["vad"] = silero.VAD.load(
        min_silence_duration=0.35,   # React faster after candidate stops speaking (default 0.55)
        min_speech_duration=0.05,    # Don't trigger on noise bursts
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
    # Tuning notes:
    # - TTS: aura-2-athena-en = clear, professional voice at 48kHz
    # - Endpointing: min 0.8s gives the candidate time to pause and continue;
    #   max 5.0s accommodates thinking pauses on hard questions
    # - min_consecutive_speech_delay: 1.2s gap between agent utterances
    #   so acknowledgement and next question don't run together
    session = AgentSession(
        vad=ctx.proc.userdata["vad"],
        stt=groq.STT(model="whisper-large-v3-turbo", language="en"),
        llm=groq.LLM(model=INTERVIEWER_LLM_MODEL),
        tts=deepgram.TTS(
            model="aura-2-athena-en",    # Clearer, deeper voice for interviewer persona
            sample_rate=48000,           # 48kHz for higher audio fidelity (default 24kHz)
            encoding="linear16",         # Uncompressed PCM for best quality
        ),
        min_endpointing_delay=0.8,       # Wait 0.8s of silence before assuming candidate is done
        max_endpointing_delay=5.0,       # Allow up to 5s thinking pauses on hard questions
        min_consecutive_speech_delay=1.2, # 1.2s gap between agent utterances (natural pacing)
    )

    # State tracking variables
    candidate_answer_count = 0
    interviewer_question_count = 0  # tracks how many questions the interviewer has asked
    waiting_for_answer = False      # True after interviewer asks, False after first candidate segment
    interview_completed = False
    time_limit_task: Optional[asyncio.Task] = None
    transcript_tasks: set[asyncio.Task] = set()  # track transcript save tasks

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
        nonlocal waiting_for_answer, interview_completed

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

            # Normal end: all answers received, this interviewer turn is the farewell.
            if candidate_answer_count >= total_questions:
                interview_completed = True
                logger.info("Interview concluding after farewell. Shutting down with drain.")
                session.shutdown(drain=True)
                return

            # SAFETY NET: If the LLM went rogue and dumped the farewell early
            # (e.g. crammed multiple questions + goodbye into one response),
            # detect it and force a clean shutdown so the call doesn't zombie.
            farewell_signals = ["goodbye", "wraps up", "wish you the best",
                                "reach out", "next steps", "conclude the call"]
            text_lower = clean_text.lower()
            if any(signal in text_lower for signal in farewell_signals):
                interview_completed = True
                logger.warning(
                    "Farewell detected early (answers %d/%d). Forcing shutdown.",
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

    # Step 8: Shutdown callback to finalize status and trigger scoring
    async def on_shutdown() -> None:
        # Await all pending transcript saves so the last answer isn't lost
        pending = [t for t in transcript_tasks if not t.done()]
        if pending:
            logger.info("Awaiting %d pending transcript save(s)...", len(pending))
            await asyncio.gather(*pending, return_exceptions=True)

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

    # Step 10: Agent speaks first: Introduction + Question 1
    await session.generate_reply(
        instructions=(
            f"Welcome the candidate warmly. Introduce yourself as the AI interviewer from {company_name}. "
            f"Tell them this interview is for the {interview_title} position and there will be {total_questions} questions. "
            "Encourage them to take their time. Then ask Question 1."
        )
    )


if __name__ == "__main__":
    cli.run_app(server)