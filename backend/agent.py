from dotenv import load_dotenv
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

# The agents CLI does not load .env on its own.
load_dotenv()

INSTRUCTIONS = """
You are a strict, professional AI technical interviewer conducting a voice interview.

You ask exactly 3 questions, one at a time, in this order:
1. Ask the candidate for a brief background and their primary tech stack.
2. Ask them to explain the difference between synchronous and asynchronous execution.
3. Ask them to describe a challenging debugging experience and how they resolved it.

Rules:
- Ask one question, then stop and wait for the candidate's answer.
- Never answer for the candidate and never give hints or the correct answer.
- Keep every spoken reply to 1-2 sentences. A brief acknowledgement is fine before the next question.
- Keep track of which question you are on. Never skip or repeat a question.
- Your words are spoken aloud: no lists, no markdown, no emojis.

After the candidate answers question 3, give the final evaluation in at most 4 spoken sentences:
a score out of 10, a short summary of their performance, then thank them politely and say goodbye.
After that, do not ask anything else.
""".strip()


class Interviewer(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=INSTRUCTIONS)


# Tuned for a small box (Render free: 512 MB RAM, 0.1 CPU), one call at a time.
server = AgentServer(
    # Default is one extra Python process per call. THREAD runs the call inside
    # the worker process instead, which saves a whole interpreter's worth of RAM.
    job_executor_type=JobExecutorType.THREAD,
    # Keep only one warm slot (each warm slot loads its own Silero VAD).
    num_idle_processes=1,
    # By default the worker marks itself "full" and rejects calls when CPU is
    # busy. On a 0.1 CPU box it would always look busy, so never reject.
    load_threshold=float("inf"),
)


def prewarm(proc: JobProcess) -> None:
    # Load the VAD model once per worker process, before any call arrives.
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session()
async def entrypoint(ctx: JobContext) -> None:
    session = AgentSession(
        vad=ctx.proc.userdata["vad"],
        stt=groq.STT(model="whisper-large-v3-turbo", language="en"),
        llm=groq.LLM(model="openai/gpt-oss-120b"),
        tts=deepgram.TTS(model="aura-2-andromeda-en"),
    )

    await session.start(
        room=ctx.room,
        agent=Interviewer(),
        # Delete the room when the call ends, so the next "Start" creates a
        # fresh room and a fresh agent gets dispatched.
        room_options=room_io.RoomOptions(delete_room_on_close=True),
    )

    # Agent speaks first: Question 1.
    await session.generate_reply(
        instructions=(
            "Greet the candidate in one short sentence, then ask question 1."
        )
    )


if __name__ == "__main__":
    cli.run_app(server)