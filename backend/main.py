"""
Main FastAPI server for HireUp.

Architecture: MERN-style layers in FastAPI
------------------------------------------
Request Flow:
  HTTP Request -> Route -> Auth Middleware (Depends) -> Controller -> Model / External Service

- Routes: Declare endpoints, paths, HTTP methods, and Depends dependencies. No business logic.
- Controllers: Implement business rules, permissions, error checks, and call models.
- Models: Plain async functions that perform raw MongoDB queries directly using PyMongo.
- Middleware: Validates Clerk JWT tokens and checks company membership.
- Services: External APIs (Clerk, LiveKit, Groq).
- Lifespan: Manages MongoDB connection pool and launches the LiveKit voice worker process.
"""

import asyncio
import logging
import os
import subprocess
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import FRONTEND_ORIGINS
from config.db import init_db, close_db
from routes.me_routes import router as me_router
from routes.company_routes import router as company_router
from routes.interview_routes import router as interview_router
from routes.attempt_routes import router as attempt_router
from routes.candidate_routes import router as candidate_router

logger = logging.getLogger("hireup-main")
logging.basicConfig(level=logging.INFO)

HERE: str = os.path.dirname(os.path.abspath(__file__))

# Global reference so the health endpoint can inspect process state
_agent_proc: subprocess.Popen | None = None
_agent_restart_count: int = 0
_MAX_AGENT_RESTARTS = 5


async def _pipe_stream(stream, log_fn) -> None:
    """Read lines from a subprocess stream and forward them to the server logger."""
    try:
        async for line in stream:
            log_fn("[agent] %s", line.decode(errors="replace").rstrip())
    except Exception:
        pass


async def _run_agent_with_restart() -> None:
    """
    Starts the LiveKit agent worker subprocess and automatically restarts it
    if it exits unexpectedly (e.g. due to a transient network error).

    Stdout and stderr are piped into the server logger so errors appear in
    Render's log stream instead of being silently discarded.

    Restarts are capped at _MAX_AGENT_RESTARTS to prevent a crash-loop from
    consuming all available CPU on the free tier.
    """
    global _agent_proc, _agent_restart_count

    while _agent_restart_count <= _MAX_AGENT_RESTARTS:
        logger.info(
            "Starting LiveKit agent worker (attempt %d/%d)...",
            _agent_restart_count + 1,
            _MAX_AGENT_RESTARTS + 1,
        )
        proc = await asyncio.create_subprocess_exec(
            sys.executable,
            "agent.py",
            "start",
            cwd=HERE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _agent_proc = proc  # expose for health endpoint

        # Drain stdout + stderr concurrently so the pipe never blocks
        await asyncio.gather(
            _pipe_stream(proc.stdout, logger.info),
            _pipe_stream(proc.stderr, logger.warning),
            proc.wait(),
        )

        exit_code = proc.returncode
        _agent_proc = None

        if exit_code == 0:
            logger.info("Agent worker exited cleanly (exit code 0). Not restarting.")
            break

        _agent_restart_count += 1
        if _agent_restart_count > _MAX_AGENT_RESTARTS:
            logger.error(
                "Agent worker has crashed %d times (last exit code %d). "
                "Giving up — check Render logs for the agent traceback above.",
                _agent_restart_count,
                exit_code,
            )
            break

        backoff = min(5 * _agent_restart_count, 30)  # 5s, 10s, 15s… capped at 30s
        logger.warning(
            "Agent worker exited with code %d. Restarting in %ds… (%d/%d)",
            exit_code,
            backoff,
            _agent_restart_count,
            _MAX_AGENT_RESTARTS,
        )
        await asyncio.sleep(backoff)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Step 1: Connect to MongoDB Atlas and ensure collection indexes
    await init_db()

    # Step 2: Launch the LiveKit agent worker as a monitored async task
    agent_task = asyncio.create_task(_run_agent_with_restart())

    try:
        yield
    finally:
        # Step 3: Stop agent worker cleanly upon shutdown
        agent_task.cancel()
        if _agent_proc is not None and _agent_proc.returncode is None:
            try:
                _agent_proc.terminate()
                await asyncio.wait_for(asyncio.shield(asyncio.create_task(
                    asyncio.get_event_loop().run_in_executor(None, _agent_proc.wait)
                )), timeout=10)
            except Exception:
                try:
                    _agent_proc.kill()
                except Exception:
                    pass

        # Step 4: Close MongoDB client connection pool
        await close_db()


app = FastAPI(title="HireUp API", lifespan=lifespan)

# Enable CORS for frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://thehireup.vercel.app",
        *FRONTEND_ORIGINS
    ])),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
async def health_check():
    """Public health check endpoint with no authentication required."""
    return {"status": "healthy", "service": "hireup-api"}


@app.get("/health/agent", tags=["Health"])
async def agent_health():
    """
    Diagnostic endpoint: reveals whether the LiveKit agent worker subprocess
    is currently running. Call this from Render logs or the browser to verify
    the agent is alive before starting an interview.
    """
    running = _agent_proc is not None and _agent_proc.returncode is None
    return {
        "agent_running": running,
        "restart_count": _agent_restart_count,
        "max_restarts": _MAX_AGENT_RESTARTS,
        "pid": _agent_proc.pid if running and _agent_proc else None,
    }


# Mount API routers under /api
app.include_router(me_router, prefix="/api")
app.include_router(company_router, prefix="/api")
app.include_router(interview_router, prefix="/api")
app.include_router(attempt_router, prefix="/api")
app.include_router(candidate_router, prefix="/api")