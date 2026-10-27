"""
Attempt collection database operations.

What this file is for:
Contains all MongoDB queries for the `attempts` collection.
Controllers call these functions and never write raw database queries.

Why `db` is a parameter everywhere:
The voice agent worker (`agent.py`) runs in a separate thread/event loop from FastAPI,
so it must use the same model functions with its own database connection.

Collection schema:
- _id: ObjectId
- interview_id: ObjectId
- company_id: ObjectId
- email: str (lowercase candidate email)
- interview_title: str (copied at invite time so no joins are needed)
- company_name: str (copied at invite time so no joins are needed)
- questions_snapshot: list[dict] (copied at invite time)
- time_limit_min: int (copied at invite time)
- expires_at: datetime (UTC, copied at invite time)
- status: str ('invited', 'in_progress', 'completed', 'abandoned', 'scored', 'score_failed')
- started_at: datetime | None
- ended_at: datetime | None
- candidate_clerk_id: str | None
- transcript: list[dict] (role: 'interviewer' | 'candidate', text: str, timestamp: datetime)
- result: dict | None
- result_error: str | None
- created_at: datetime (UTC)
"""

from typing import Any, Optional
from bson import ObjectId
from pymongo import ReturnDocument
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.errors import DuplicateKeyError
from utils.constants import (
    STATUS_INVITED,
    STATUS_IN_PROGRESS,
    STATUS_COMPLETED,
    STATUS_ABANDONED,
    STATUS_SCORED,
    STATUS_SCORE_FAILED,
)
from utils.helpers import now_utc, normalize_email


async def create_single_attempt_if_not_exists(
    db: AsyncDatabase,
    interview_doc: dict[str, Any],
    company_name: str,
    candidate_email: str
) -> bool:
    """
    Attempts to insert an attempt document for a candidate email.
    If the email was already invited for this interview, the unique index on
    (interview_id, email) triggers a DuplicateKeyError and the insert is skipped.

    Returns:
        True if created, False if skipped as duplicate.
    """
    clean_email = normalize_email(candidate_email)
    current_time = now_utc()

    doc: dict[str, Any] = {
        "interview_id": interview_doc["_id"],
        "company_id": interview_doc["company_id"],
        "email": clean_email,
        "interview_title": interview_doc["title"],
        "company_name": company_name,
        "questions_snapshot": interview_doc["questions"],
        "time_limit_min": interview_doc["time_limit_min"],
        "expires_at": interview_doc["expires_at"],
        "status": STATUS_INVITED,
        "started_at": None,
        "ended_at": None,
        "candidate_clerk_id": None,
        "transcript": [],
        "result": None,
        "result_error": None,
        "created_at": current_time,
    }

    try:
        await db["attempts"].insert_one(doc)
        return True
    except DuplicateKeyError:
        return False


async def create_attempts_for_interview(
    db: AsyncDatabase,
    interview_doc: dict[str, Any],
    company_name: str,
    emails: list[str]
) -> dict[str, list[str]]:
    """
    Invites a list of candidate emails to an interview.
    Skips duplicates using a plain for loop and explicit error handling.

    Returns:
        dict with "created" and "skipped" lists of email strings.
    """
    created_list: list[str] = []
    skipped_list: list[str] = []

    # De-duplicate incoming email list preserving order
    seen_in_request: set[str] = set()
    unique_emails: list[str] = []
    for raw_email in emails:
        clean = normalize_email(raw_email)
        if clean not in seen_in_request:
            seen_in_request.add(clean)
            unique_emails.append(clean)

    for email in unique_emails:
        was_created = await create_single_attempt_if_not_exists(
            db=db,
            interview_doc=interview_doc,
            company_name=company_name,
            candidate_email=email,
        )
        if was_created:
            created_list.append(email)
        else:
            skipped_list.append(email)

    return {
        "created": created_list,
        "skipped": skipped_list,
    }


async def count_attempts_by_status_for_company(
    db: AsyncDatabase,
    company_id: ObjectId
) -> dict[str, dict[str, int]]:
    """
    Aggregates attempt counts grouped by (interview_id, status) for a company.

    Returns:
        Mapping of str(interview_id) -> dict of {status_name: count}.
    """
    pipeline = [
        {"$match": {"company_id": company_id}},
        {
            "$group": {
                "_id": {
                    "interview_id": "$interview_id",
                    "status": "$status",
                },
                "count": {"$sum": 1},
            }
        },
    ]

    result_mapping: dict[str, dict[str, int]] = {}
    cursor = await db["attempts"].aggregate(pipeline)
    async for item in cursor:
        group_id = item["_id"]
        interview_id_str = str(group_id["interview_id"])
        status_name = str(group_id["status"])
        count_val = int(item["count"])

        if interview_id_str not in result_mapping:
            result_mapping[interview_id_str] = {}
        result_mapping[interview_id_str][status_name] = count_val

    return result_mapping


async def find_attempts_for_interview_summary(
    db: AsyncDatabase,
    interview_id: ObjectId,
    company_id: ObjectId
) -> list[dict[str, Any]]:
    """
    Fetches attempts for an interview excluding heavy transcript/result bodies.
    Uses MongoDB projection to keep the payload lightweight.

    Returns:
        List of attempt summary documents.
    """
    filter_query: dict[str, Any] = {
        "interview_id": interview_id,
        "company_id": company_id,
    }
    projection: dict[str, int] = {
        "_id": 1,
        "interview_id": 1,
        "company_id": 1,
        "email": 1,
        "status": 1,
        "started_at": 1,
        "ended_at": 1,
        "created_at": 1,
        "expires_at": 1,
        "result.overall_score": 1,
        "result.recommendation": 1,
        "result.summary": 1,
    }

    cursor = db["attempts"].find(filter_query, projection)
    attempts_list: list[dict[str, Any]] = []
    async for doc in cursor:
        attempts_list.append(doc)


async def find_all_attempts_for_company(
    db: AsyncDatabase,
    company_id: ObjectId
) -> list[dict[str, Any]]:
    """
    Fetches all candidate attempts across all interviews for a company.
    Excludes full transcript array to keep list query fast.
    """
    filter_query: dict[str, Any] = {
        "company_id": company_id,
    }
    projection: dict[str, int] = {
        "_id": 1,
        "interview_id": 1,
        "company_id": 1,
        "interview_title": 1,
        "company_name": 1,
        "email": 1,
        "status": 1,
        "started_at": 1,
        "ended_at": 1,
        "created_at": 1,
        "expires_at": 1,
        "result.overall_score": 1,
        "result.recommendation": 1,
        "result.summary": 1,
    }

    cursor = db["attempts"].find(filter_query, projection).sort("created_at", -1)
    attempts_list: list[dict[str, Any]] = []
    async for doc in cursor:
        attempts_list.append(doc)

    return attempts_list


async def find_attempt_by_id_and_company(
    db: AsyncDatabase,
    attempt_id: ObjectId,
    company_id: ObjectId
) -> Optional[dict[str, Any]]:
    """
    Finds a full attempt including transcript and result for recruiter review.
    Guarantees tenant isolation: scoped to company_id.

    Returns:
        The attempt document if found, or None.
    """
    filter_query: dict[str, Any] = {
        "_id": attempt_id,
        "company_id": company_id,
    }
    attempt_doc = await db["attempts"].find_one(filter_query)
    return attempt_doc


async def reset_attempt_doc(
    db: AsyncDatabase,
    attempt_id: ObjectId,
    company_id: ObjectId
) -> Optional[dict[str, Any]]:
    """
    Resets an attempt document so a candidate can retry:
    - Sets status back to 'invited'
    - Clears started_at, ended_at, transcript, result, result_error

    Returns:
        The updated attempt document.
    """
    filter_query: dict[str, Any] = {
        "_id": attempt_id,
        "company_id": company_id,
    }
    update_op: dict[str, Any] = {
        "$set": {
            "status": STATUS_INVITED,
            "started_at": None,
            "ended_at": None,
            "candidate_clerk_id": None,
            "transcript": [],
            "result": None,
            "result_error": None,
        }
    }
    await db["attempts"].update_one(filter_query, update_op)
    updated_doc = await db["attempts"].find_one(filter_query)
    return updated_doc


async def find_attempts_by_emails(
    db: AsyncDatabase,
    emails_list: list[str]
) -> list[dict[str, Any]]:
    """
    Finds all attempts assigned to any of the candidate's verified emails.
    Used for candidate's 'My Interviews' list.
    """
    clean_emails: list[str] = []
    for em in emails_list:
        clean_emails.append(normalize_email(em))

    filter_query: dict[str, Any] = {"email": {"$in": clean_emails}}
    projection: dict[str, int] = {
        "_id": 1,
        "company_name": 1,
        "interview_title": 1,
        "status": 1,
        "expires_at": 1,
        "time_limit_min": 1,
        "created_at": 1,
    }

    cursor = db["attempts"].find(filter_query, projection).sort("created_at", -1)
    attempts: list[dict[str, Any]] = []
    async for doc in cursor:
        attempts.append(doc)

    return attempts


async def find_attempt_by_id_only(
    db: AsyncDatabase,
    attempt_id: ObjectId
) -> Optional[dict[str, Any]]:
    """
    Finds an attempt by ID alone.
    Used to diagnose whether a failed start gate was due to expiry, status, or bad id.
    """
    query: dict[str, Any] = {"_id": attempt_id}
    attempt_doc = await db["attempts"].find_one(query)
    return attempt_doc


async def start_attempt_if_allowed(
    db: AsyncDatabase,
    attempt_id: ObjectId,
    verified_emails: list[str],
    candidate_clerk_id: str
) -> Optional[dict[str, Any]]:
    """
    The atomic start gate for an interview attempt.

    Why this MUST be atomic (find_one_and_update):
    If a candidate has two browser tabs open and clicks 'Start' simultaneously in both,
    a regular read-then-write would allow both tabs to see status='invited' and create
    two sessions. With find_one_and_update, MongoDB executes the check and the status
    transition as a single atomic operation: exactly ONE tab will successfully claim the
    transition to 'in_progress', and the second tab will match 0 documents.

    Filter rules:
    - _id matches attempt_id
    - email is in verified_emails
    - status == 'invited'
    - expires_at > now (UTC)

    Returns:
        The updated attempt document if started, or None if rules were not satisfied.
    """
    clean_emails: list[str] = []
    for em in verified_emails:
        clean_emails.append(normalize_email(em))

    current_time = now_utc()

    filter_query: dict[str, Any] = {
        "_id": attempt_id,
        "email": {"$in": clean_emails},
        "status": STATUS_INVITED,
        "expires_at": {"$gt": current_time},
    }

    update_operation: dict[str, Any] = {
        "$set": {
            "status": STATUS_IN_PROGRESS,
            "started_at": current_time,
            "candidate_clerk_id": candidate_clerk_id,
        }
    }

    updated_doc = await db["attempts"].find_one_and_update(
        filter_query,
        update_operation,
        return_document=ReturnDocument.AFTER,
    )
    return updated_doc


async def revert_attempt_to_invited(
    db: AsyncDatabase,
    attempt_id: ObjectId
) -> None:
    """
    Reverts an attempt back to 'invited' if LiveKit token generation fails after the gate.
    Prevents burning the candidate's invite if an infrastructure error occurs.
    """
    filter_query: dict[str, Any] = {"_id": attempt_id}
    update_op: dict[str, Any] = {
        "$set": {
            "status": STATUS_INVITED,
            "started_at": None,
            "candidate_clerk_id": None,
        }
    }
    await db["attempts"].update_one(filter_query, update_op)


async def append_transcript_message(
    db: AsyncDatabase,
    attempt_id: ObjectId,
    role: str,
    text: str
) -> None:
    """
    Appends a single spoken message to the attempt transcript array in MongoDB ($push).
    Called in real-time as each conversation item occurs so an unexpected crash
    never causes data loss.
    """
    clean_text = text.strip()
    if len(clean_text) == 0:
        return

    current_time = now_utc()
    message_item = {
        "role": role,
        "text": clean_text,
        "timestamp": current_time,
    }

    filter_query: dict[str, Any] = {"_id": attempt_id}
    update_op: dict[str, Any] = {"$push": {"transcript": message_item}}
    await db["attempts"].update_one(filter_query, update_op)


async def finish_attempt_session(
    db: AsyncDatabase,
    attempt_id: ObjectId,
    final_status: str
) -> Optional[dict[str, Any]]:
    """
    Called on agent shutdown when an interview ends.
    Sets ended_at and updates status (completed or abandoned) only if still in_progress.

    Returns:
        The updated attempt document.
    """
    current_time = now_utc()
    filter_query: dict[str, Any] = {
        "_id": attempt_id,
        "status": STATUS_IN_PROGRESS,
    }
    update_op: dict[str, Any] = {
        "$set": {
            "status": final_status,
            "ended_at": current_time,
        }
    }
    await db["attempts"].update_one(filter_query, update_op)
    updated_doc = await db["attempts"].find_one({"_id": attempt_id})
    return updated_doc


async def save_attempt_score(
    db: AsyncDatabase,
    attempt_id: ObjectId,
    result_data: Optional[dict[str, Any]],
    error_message: Optional[str] = None
) -> dict[str, Any]:
    """
    Saves scoring results from the LLM evaluator to the attempt document.
    If error_message is provided, sets status to 'score_failed'.
    If result_data is provided, sets status to 'scored'.

    Returns:
        The updated attempt document.
    """
    filter_query: dict[str, Any] = {"_id": attempt_id}
    if error_message is not None:
        update_op: dict[str, Any] = {
            "$set": {
                "status": STATUS_SCORE_FAILED,
                "result_error": error_message,
            }
        }
    else:
        update_op = {
            "$set": {
                "status": STATUS_SCORED,
                "result": result_data,
                "result_error": None,
            }
        }

    await db["attempts"].update_one(filter_query, update_op)
    updated_doc = await db["attempts"].find_one(filter_query)
    if updated_doc is None:
        raise RuntimeError("Failed to retrieve attempt after saving score")
    return updated_doc


async def delete_attempt_by_id_and_company(
    db: AsyncDatabase,
    attempt_id: ObjectId,
    company_id: ObjectId
) -> bool:
    """
    Deletes a candidate attempt document strictly scoped to the recruiter's company.
    """
    filter_query: dict[str, Any] = {
        "_id": attempt_id,
        "company_id": company_id,
    }
    result = await db["attempts"].delete_one(filter_query)
    return result.deleted_count > 0

