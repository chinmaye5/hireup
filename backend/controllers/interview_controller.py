"""
Interview controller.

What this file is for:
Handles recruiter operations on interviews:
- Creating a new interview template
- Listing all interviews for the recruiter's company (with status counts)
- Fetching single interview details with attempt summaries (no transcripts)
- Inviting candidate emails to an interview
"""

from datetime import datetime, timezone
from typing import Any
from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.asynchronous.database import AsyncDatabase
from models import interview_model, attempt_model, company_model
from schemas.interview_schemas import CreateInterviewRequest
from schemas.attempt_schemas import InviteCandidatesRequest
from utils.helpers import to_object_id, now_utc
from utils.serializers import (
    serialize_interview_summary,
    serialize_interview_detail,
)


async def create_interview(
    payload: CreateInterviewRequest,
    current_user: dict[str, Any],
    db: AsyncDatabase
) -> dict[str, Any]:
    """
    Creates a new interview template scoped to the recruiter's company.
    Validates that expires_at is in the future.
    """
    company_id: ObjectId = current_user["company_id"]
    user_id: ObjectId = current_user["user_id"]

    # Step 1: Ensure expires_at is strictly in the future
    current_time = now_utc()
    expires_at = payload.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at <= current_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expiry time must be in the future"
        )

    # Step 2: Convert question Pydantic items to plain dictionaries
    questions_data: list[dict[str, Any]] = []
    for q in payload.questions:
        questions_data.append({
            "text": q.text.strip(),
            "rubric": q.rubric.strip() if q.rubric is not None else None,
        })

    # Step 3: Insert into database using model
    interview_doc = await interview_model.insert_interview(
        db=db,
        company_id=company_id,
        created_by=user_id,
        title=payload.title.strip(),
        questions=questions_data,
        expires_at=expires_at,
        time_limit_min=payload.time_limit_min,
    )

    return serialize_interview_summary(interview_doc)


async def list_interviews(
    current_user: dict[str, Any],
    db: AsyncDatabase
) -> list[dict[str, Any]]:
    """
    Lists all interviews for the recruiter's company with attempt counts per status.
    """
    company_id: ObjectId = current_user["company_id"]

    # Step 1: Query company's interviews
    interviews = await interview_model.find_interviews_by_company(db, company_id)

    # Step 2: Fetch attempt counts grouped by (interview_id, status)
    counts_map = await attempt_model.count_attempts_by_status_for_company(db, company_id)

    # Step 3: Serialize each interview with its counts
    serialized_list: list[dict[str, Any]] = []
    for interview_doc in interviews:
        int_id_str = str(interview_doc["_id"])
        status_counts = counts_map.get(int_id_str, {})
        serialized = serialize_interview_summary(interview_doc, status_counts)
        serialized_list.append(serialized)

    return serialized_list


async def get_interview_detail(
    interview_id_str: str,
    current_user: dict[str, Any],
    db: AsyncDatabase
) -> dict[str, Any]:
    """
    Fetches an interview and its candidate attempts.
    Does NOT return transcripts (uses projection) for performance.
    Guarantees tenant isolation: returns 404 if not found in current company.
    """
    company_id: ObjectId = current_user["company_id"]
    interview_id = to_object_id(interview_id_str)
    if interview_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    # Step 1: Find interview scoped to company
    interview_doc = await interview_model.find_interview_by_id_and_company(
        db=db,
        interview_id=interview_id,
        company_id=company_id
    )
    if interview_doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    # Step 2: Find attempts summary list (no transcripts)
    attempts = await attempt_model.find_attempts_for_interview_summary(
        db=db,
        interview_id=interview_id,
        company_id=company_id
    )

    return serialize_interview_detail(interview_doc, attempts)


async def invite_candidates(
    interview_id_str: str,
    payload: InviteCandidatesRequest,
    current_user: dict[str, Any],
    db: AsyncDatabase
) -> dict[str, list[str]]:
    """
    Invites candidate emails to an interview.
    Skips emails that were already invited to this interview.
    """
    company_id: ObjectId = current_user["company_id"]
    interview_id = to_object_id(interview_id_str)
    if interview_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    # Step 1: Ensure interview belongs to recruiter's company
    interview_doc = await interview_model.find_interview_by_id_and_company(
        db=db,
        interview_id=interview_id,
        company_id=company_id
    )
    if interview_doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    # Step 2: Fetch company name for snapshot
    company_doc = await company_model.find_company_by_id(db, company_id)
    company_name = "Company"
    if company_doc is not None:
        company_name = company_doc.get("name", "Company")

    # Step 3: Insert attempts for each new email
    result = await attempt_model.create_attempts_for_interview(
        db=db,
        interview_doc=interview_doc,
        company_name=company_name,
        emails=payload.emails,
    )

    return result


async def delete_interview(
    interview_id_str: str,
    current_user: dict[str, Any],
    db: AsyncDatabase
) -> dict[str, str]:
    """
    Deletes an interview and all associated attempts belonging to the recruiter's company.
    """
    company_id: ObjectId = current_user["company_id"]
    interview_id = to_object_id(interview_id_str)
    if interview_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    deleted = await interview_model.delete_interview_by_id_and_company(
        db=db,
        interview_id=interview_id,
        company_id=company_id
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    return {"message": "Interview deleted successfully"}

