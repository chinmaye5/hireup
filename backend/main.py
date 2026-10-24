import os
import subprocess
import sys
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from livekit import api

load_dotenv()

ROOM_NAME = "ai-interview-room"
IDENTITY = "candidate-test"
HERE = os.path.dirname(os.path.abspath(__file__))


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the LiveKit agent worker together with the API server.
    # sys.executable = the same Python (and venv) that is running uvicorn.
    agent_proc = subprocess.Popen(
        [sys.executable, "agent.py", "start"],
        cwd=HERE,
    )
    try:
        yield
    finally:
        # Runs when the server stops (Ctrl+C or --reload restart).
        agent_proc.terminate()
        try:
            agent_proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            agent_proc.kill()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/token")
async def get_token():
    token = (
        api.AccessToken(
            os.environ["LIVEKIT_API_KEY"],
            os.environ["LIVEKIT_API_SECRET"],
        )
        .with_identity(IDENTITY)
        .with_name("Candidate")
        .with_grants(api.VideoGrants(room_join=True, room=ROOM_NAME))
        .to_jwt()
    )
    return {"token": token, "url": os.environ["LIVEKIT_URL"]}