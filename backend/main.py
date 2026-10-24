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

HERE: str = os.path.dirname(os.path.abspath(__file__))


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Step 1: Connect to MongoDB Atlas and ensure collection indexes
    await init_db()

    # Step 2: Start the LiveKit agent worker subprocess alongside FastAPI
    agent_proc = subprocess.Popen(
        [sys.executable, "agent.py", "start"],
        cwd=HERE,
    )

    try:
        yield
    finally:
        # Step 3: Stop agent worker cleanly upon shutdown
        agent_proc.terminate()
        try:
            agent_proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            agent_proc.kill()

        # Step 4: Close MongoDB client connection pool
        await close_db()


app = FastAPI(title="HireUp API", lifespan=lifespan)

# Enable CORS for frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
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