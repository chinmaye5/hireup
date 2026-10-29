"""
Candidate route declarations.

What this file is for:
Declares URL paths for candidate actions:
- GET  /api/my-attempts
- POST /api/attempts/{attempt_id}/start

Requires candidate authentication (get_current_user).
Does NOT require company membership.
"""

from typing import Any
from fastapi import APIRouter, Depends
from pymongo.asynchronous.database import AsyncDatabase
from config.db import get_db
from middleware.auth_middleware import get_current_user
from controllers import candidate_controller

router = APIRouter(tags=["Candidate"])


@router.get("/my-attempts")
async def get_my_attempts_route(
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db)
) -> list[dict[str, Any]]:
    """Lists interview attempts assigned to the candidate's verified emails."""
    return await candidate_controller.get_my_attempts(
        current_user=current_user,
        db=db
    )


@router.get("/attempts/{attempt_id}/public-info")
async def get_attempt_public_info_route(
    attempt_id: str,
    db: AsyncDatabase = Depends(get_db)
) -> dict[str, Any]:
    """
    Public metadata endpoint for interview landing page.
    Returns safe summary (company, role, duration, expiry, invited email)
    before candidate starts or logs in.
    """
    return await candidate_controller.get_attempt_public_info(
        attempt_id_str=attempt_id,
        db=db
    )


@router.post("/attempts/{attempt_id}/start")
async def start_attempt_route(
    attempt_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db)
) -> dict[str, Any]:
    """
    Candidate start gate:
    Atomically updates attempt to 'in_progress' and mints a LiveKit WebRTC token.
    """
    return await candidate_controller.start_attempt(
        attempt_id_str=attempt_id,
        current_user=current_user,
        db=db
    )


@router.post("/attempts/{attempt_id}/release")
async def release_attempt_route(
    attempt_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db)
) -> dict[str, Any]:
    """
    Gives the invite back if the AI interviewer never joined (no transcript yet),
    so the candidate can press Start again instead of being locked out.
    """
    return await candidate_controller.release_attempt(
        attempt_id_str=attempt_id,
        current_user=current_user,
        db=db
    )
