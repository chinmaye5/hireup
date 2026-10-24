"""
Interview collection database operations.

What this file is for:
Contains all MongoDB queries for the `interviews` collection.
Controllers call these functions and never write raw database queries.

Collection schema:
- _id: ObjectId
- company_id: ObjectId
- created_by: ObjectId (user_id of recruiter)
- title: str
- questions: list[dict] (each has 'text' and optional 'rubric')
- expires_at: datetime (UTC)
- time_limit_min: int
- created_at: datetime (UTC)
"""

from typing import Any, Optional
from bson import ObjectId
from pymongo import DESCENDING
from pymongo.asynchronous.database import AsyncDatabase
from utils.helpers import now_utc


async def insert_interview(
    db: AsyncDatabase,
    company_id: ObjectId,
    created_by: ObjectId,
    title: str,
    questions: list[dict[str, Any]],
    expires_at: Any,
    time_limit_min: int,
) -> dict[str, Any]:
    """
    Inserts a new interview template document into MongoDB.

    Returns:
        The newly inserted interview document.
    """
    current_time = now_utc()
    doc: dict[str, Any] = {
        "company_id": company_id,
        "created_by": created_by,
        "title": title.strip(),
        "questions": questions,
        "expires_at": expires_at,
        "time_limit_min": time_limit_min,
        "created_at": current_time,
    }

    insert_result = await db["interviews"].insert_one(doc)
    new_id = insert_result.inserted_id

    created_interview = await db["interviews"].find_one({"_id": new_id})
    if created_interview is None:
        raise RuntimeError("Failed to retrieve interview after insert")

    return created_interview


async def find_interviews_by_company(
    db: AsyncDatabase,
    company_id: ObjectId
) -> list[dict[str, Any]]:
    """
    Finds all interviews belonging to a company, ordered newest first.

    Returns:
        List of interview documents.
    """
    filter_query: dict[str, Any] = {"company_id": company_id}
    cursor = db["interviews"].find(filter_query).sort("created_at", DESCENDING)

    interviews_list: list[dict[str, Any]] = []
    async for interview_doc in cursor:
        interviews_list.append(interview_doc)

    return interviews_list


async def find_interview_by_id_and_company(
    db: AsyncDatabase,
    interview_id: ObjectId,
    company_id: ObjectId
) -> Optional[dict[str, Any]]:
    """
    Finds a single interview by ID, strictly scoped to the tenant's company_id.

    Returns:
        The interview document if found and owned by company, or None.
    """
    filter_query: dict[str, Any] = {
        "_id": interview_id,
        "company_id": company_id,
    }
    interview_doc = await db["interviews"].find_one(filter_query)
    return interview_doc


async def delete_interview_by_id_and_company(
    db: AsyncDatabase,
    interview_id: ObjectId,
    company_id: ObjectId
) -> bool:
    """
    Deletes an interview and all associated attempts belonging to a company.
    """
    result = await db["interviews"].delete_one({"_id": interview_id, "company_id": company_id})
    if result.deleted_count > 0:
        await db["attempts"].delete_many({"interview_id": interview_id, "company_id": company_id})
        return True
    return False

