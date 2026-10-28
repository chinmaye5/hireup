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

Deployment note (Render free tier):
  The LiveKit voice agent (agent.py) runs as a SEPARATE Render Background Worker,
  NOT as a subprocess of this server.  This is intentional:
    - Web service:        FastAPI alone  (~150 MB RAM)
    - Background worker:  agent.py alone (~300-350 MB RAM)
  Running both in one container exceeded the 512 MB free-tier limit and caused
  OOM kills that silently killed the agent mid-interview.

  The agent connects to LiveKit Cloud directly; it does not need to be co-located
  with this API server.
"""

import logging
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect to MongoDB Atlas and ensure collection indexes
    await init_db()
    yield
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