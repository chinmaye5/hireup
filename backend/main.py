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
- Lifespan: Manages MongoDB connection pool.

Deployment note:
  Render free tier runs ONLY this FastAPI service (no audio/ML in this process).
  The LiveKit voice agent (agent.py) is deployed to LiveKit Cloud Agents via
  .github/workflows/deploy-livekit-agent.yml, so none of its RAM/CPU is used here.
  Do NOT also run agent.py on Render, or both workers will compete for the same jobs.
"""

import asyncio
import logging
import os
import urllib.request
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import FRONTEND_ORIGINS, validate_api_env
from config.db import init_db, close_db
from routes.me_routes import router as me_router
from routes.company_routes import router as company_router
from routes.interview_routes import router as interview_router
from routes.attempt_routes import router as attempt_router
from routes.candidate_routes import router as candidate_router

logger = logging.getLogger("hireup-main")
logging.basicConfig(level=logging.INFO)

# URL of the separate agent Render Web Service.
# When set, FastAPI pings it every 4 minutes to prevent Render free tier
# from spinning the agent down due to inactivity.
# Set via env var: AGENT_URL=https://hireup-agent.onrender.com
_AGENT_URL: str = os.getenv("AGENT_URL", "").rstrip("/")


async def _keep_agent_alive() -> None:
    """Pings the agent health endpoint every 4 minutes (Render sleeps after 15min)."""
    loop = asyncio.get_event_loop()
    while True:
        await asyncio.sleep(4 * 60)  # every 4 minutes
        try:
            await loop.run_in_executor(
                None,
                lambda: urllib.request.urlopen(f"{_AGENT_URL}/health", timeout=10),
            )
            logger.debug("Keep-alive ping to agent succeeded.")
        except Exception as exc:
            logger.warning("Keep-alive ping to agent failed: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_api_env()

    # Connect to MongoDB Atlas and ensure collection indexes
    await init_db()

    # Start keep-alive pinger if AGENT_URL is configured
    _ping_task = None
    if _AGENT_URL:
        _ping_task = asyncio.create_task(_keep_agent_alive())
        logger.info("Keep-alive pinger started for agent at %s", _AGENT_URL)

    yield

    if _ping_task:
        _ping_task.cancel()

    # Close MongoDB client connection pool on shutdown
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


# Mount API routers under /api
app.include_router(me_router, prefix="/api")
app.include_router(company_router, prefix="/api")
app.include_router(interview_router, prefix="/api")
app.include_router(attempt_router, prefix="/api")
app.include_router(candidate_router, prefix="/api")