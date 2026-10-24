"""
Attempt controller (Recruiter operations).

What this file is for:
Handles recruiter actions on candidate attempts:
- Viewing full attempt detail (including transcript and score)
- Re-scoring an attempt (placeholder until scoring service in Phase 4)
- Resetting an attempt so the candidate can retry
"""

from datetime import datetime, timezone, timedelta
from typing import Any
from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.asynchronous.database import AsyncDatabase
from models import attempt_model
from utils.constants import STATUS_IN_PROGRESS, STATUS_COMPLETED, STATUS_SCORED, STATUS_SCORE_FAILED
from utils.helpers import to_object_id, now_utc
from utils.serializers import serialize_attempt_detail


async def get_attempt_detail(
    attempt_id_str: str,
    current_user: dict[str, Any],
    db: AsyncDatabase
) -> dict[str, Any]:
    """
    Fetches full attempt details for recruiter review.
    Guarantees tenant isolation: returns 404 if attempt is from another company.
    """
    company_id: ObjectId = current_user["company_id"]
    attempt_id = to_object_id(attempt_id_str)
    if attempt_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found"
        )

    attempt_doc = await attempt_model.find_attempt_by_id_and_company(
        db=db,
        attempt_id=attempt_id,
        company_id=company_id
    )
    if attempt_doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found"
        )

    serialized = serialize_attempt_detail(attempt_doc)
    return serialized


async def reset_attempt(
    attempt_id_str: str,
    current_user: dict[str, Any],
    db: AsyncDatabase
) -> dict[str, Any]:
    """
    Lets a recruiter reset an attempt so a candidate can retry.
    Disallowed while in_progress unless (started_at + time_limit + 10 min) has passed.
    """
    company_id: ObjectId = current_user["company_id"]
    attempt_id = to_object_id(attempt_id_str)
    if attempt_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found"
        )

    attempt_doc = await attempt_model.find_attempt_by_id_and_company(
        db=db,
        attempt_id=attempt_id,
        company_id=company_id
    )
    if attempt_doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found"
        )

    # Check if currently in_progress
    current_status = attempt_doc.get("status")
    if current_status == STATUS_IN_PROGRESS:
        started_at = attempt_doc.get("started_at")
        time_limit_min = attempt_doc.get("time_limit_min", 30)
        if started_at is not None:
            if started_at.tzinfo is None:
                started_at = started_at.replace(tzinfo=timezone.utc)
            # Cannot reset until time_limit + 10 min buffer has elapsed
            cutoff_time = started_at + timedelta(minutes=time_limit_min + 10)
            if now_utc() < cutoff_time:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot reset an attempt that is currently in progress"
                )

    # Reset attempt back to invited
    updated_doc = await attempt_model.reset_attempt_doc(
        db=db,
        attempt_id=attempt_id,
        company_id=company_id
    )
    return serialize_attempt_detail(updated_doc)


async def rescore_attempt(
    attempt_id_str: str,
    current_user: dict[str, Any],
    db: AsyncDatabase
) -> dict[str, Any]:
    """
    Triggers re-scoring of an attempt (allowed for completed, scored, or score_failed).
    Delegates to scoring_service (implemented in Phase 4).
    """
    company_id: ObjectId = current_user["company_id"]
    attempt_id = to_object_id(attempt_id_str)
    if attempt_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found"
        )

    attempt_doc = await attempt_model.find_attempt_by_id_and_company(
        db=db,
        attempt_id=attempt_id,
        company_id=company_id
    )
    if attempt_doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found"
        )

    current_status = attempt_doc.get("status")
    allowed_statuses = [STATUS_COMPLETED, STATUS_SCORED, STATUS_SCORE_FAILED]
    if current_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attempt must be completed before re-scoring"
        )

    from services import scoring_service
    scored_doc = await scoring_service.score_attempt(db, attempt_id)
    return serialize_attempt_detail(scored_doc)


async def delete_attempt(
    attempt_id_str: str,
    current_user: dict[str, Any],
    db: AsyncDatabase
) -> dict[str, str]:
    """
    Deletes an invited candidate attempt (e.g. if the recruiter accidentally added the wrong email).
    Guarantees tenant isolation: returns 404 if not found in current company.
    """
    company_id: ObjectId = current_user["company_id"]
    attempt_id = to_object_id(attempt_id_str)
    if attempt_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate invite not found"
        )

    deleted = await attempt_model.delete_attempt_by_id_and_company(
        db=db,
        attempt_id=attempt_id,
        company_id=company_id
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate invite not found"
        )

    return {"message": "Candidate invite deleted successfully"}

