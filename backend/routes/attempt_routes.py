"""
Attempt route declarations (Recruiter operations).

What this file is for:
Declares URL paths for recruiter attempt review and management:
- GET  /api/attempts/{id}
- POST /api/attempts/{id}/rescore
- POST /api/attempts/{id}/reset

All routes require company membership via `require_company_user`.
"""

from typing import Any
from fastapi import APIRouter, Depends
from pymongo.asynchronous.database import AsyncDatabase
from config.db import get_db
from middleware.auth_middleware import require_company_user
from controllers import attempt_controller

router = APIRouter(prefix="/attempts", tags=["Attempts (Recruiter)"])


@router.get("")
async def list_company_attempts_route(
    current_user: dict[str, Any] = Depends(require_company_user),
    db: AsyncDatabase = Depends(get_db)
) -> list[dict[str, Any]]:
    """Lists all candidate attempts for the recruiter's company."""
    return await attempt_controller.list_company_attempts(
        current_user=current_user,
        db=db
    )


@router.get("/{attempt_id}")
async def get_attempt_detail_route(
    attempt_id: str,
    current_user: dict[str, Any] = Depends(require_company_user),
    db: AsyncDatabase = Depends(get_db)
) -> dict[str, Any]:
    """Fetches full attempt detail including transcript and result."""
    return await attempt_controller.get_attempt_detail(
        attempt_id_str=attempt_id,
        current_user=current_user,
        db=db
    )


@router.post("/{attempt_id}/rescore")
@router.post("/{attempt_id}/score")
async def rescore_attempt_route(
    attempt_id: str,
    current_user: dict[str, Any] = Depends(require_company_user),
    db: AsyncDatabase = Depends(get_db)
) -> dict[str, Any]:
    """Re-scores an attempt using the LLM scoring service."""
    return await attempt_controller.rescore_attempt(
        attempt_id_str=attempt_id,
        current_user=current_user,
        db=db
    )


@router.post("/{attempt_id}/reset")
async def reset_attempt_route(
    attempt_id: str,
    current_user: dict[str, Any] = Depends(require_company_user),
    db: AsyncDatabase = Depends(get_db)
) -> dict[str, Any]:
    """Resets an attempt back to invited so candidate can retry."""
    return await attempt_controller.reset_attempt(
        attempt_id_str=attempt_id,
        current_user=current_user,
        db=db
    )


@router.delete("/{attempt_id}")
async def delete_attempt_route(
    attempt_id: str,
    current_user: dict[str, Any] = Depends(require_company_user),
    db: AsyncDatabase = Depends(get_db)
) -> dict[str, str]:
    """Deletes an invited candidate attempt (e.g. if the wrong email was added)."""
    return await attempt_controller.delete_attempt(
        attempt_id_str=attempt_id,
        current_user=current_user,
        db=db
    )

