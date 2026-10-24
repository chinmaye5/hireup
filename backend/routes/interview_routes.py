"""
Interview route declarations.

What this file is for:
Declares URL paths for recruiter interview operations:
- POST /api/interviews
- GET  /api/interviews
- GET  /api/interviews/{id}
- POST /api/interviews/{id}/invites

All routes require company membership via `require_company_user`.
"""

from typing import Any
from fastapi import APIRouter, Depends, status
from pymongo.asynchronous.database import AsyncDatabase
from config.db import get_db
from middleware.auth_middleware import require_company_user
from schemas.interview_schemas import CreateInterviewRequest
from schemas.attempt_schemas import InviteCandidatesRequest
from controllers import interview_controller

router = APIRouter(prefix="/interviews", tags=["Interviews"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_interview_route(
    payload: CreateInterviewRequest,
    current_user: dict[str, Any] = Depends(require_company_user),
    db: AsyncDatabase = Depends(get_db)
) -> dict[str, Any]:
    """Creates a new interview template for the recruiter's company."""
    return await interview_controller.create_interview(
        payload=payload,
        current_user=current_user,
        db=db
    )


@router.get("")
async def list_interviews_route(
    current_user: dict[str, Any] = Depends(require_company_user),
    db: AsyncDatabase = Depends(get_db)
) -> list[dict[str, Any]]:
    """Lists all interviews for the recruiter's company with attempt counts."""
    return await interview_controller.list_interviews(
        current_user=current_user,
        db=db
    )


@router.get("/{interview_id}")
async def get_interview_detail_route(
    interview_id: str,
    current_user: dict[str, Any] = Depends(require_company_user),
    db: AsyncDatabase = Depends(get_db)
) -> dict[str, Any]:
    """Fetches an interview and its attempt summaries (no transcripts)."""
    return await interview_controller.get_interview_detail(
        interview_id_str=interview_id,
        current_user=current_user,
        db=db
    )


@router.post("/{interview_id}/invites")
async def invite_candidates_route(
    interview_id: str,
    payload: InviteCandidatesRequest,
    current_user: dict[str, Any] = Depends(require_company_user),
    db: AsyncDatabase = Depends(get_db)
) -> dict[str, list[str]]:
    """Invites candidate emails to an interview. Skips duplicates."""
    return await interview_controller.invite_candidates(
        interview_id_str=interview_id,
        payload=payload,
        current_user=current_user,
        db=db
    )


@router.delete("/{interview_id}")
async def delete_interview_route(
    interview_id: str,
    current_user: dict[str, Any] = Depends(require_company_user),
    db: AsyncDatabase = Depends(get_db)
) -> dict[str, str]:
    """Deletes an interview and all its candidate attempts."""
    return await interview_controller.delete_interview(
        interview_id_str=interview_id,
        current_user=current_user,
        db=db
    )

