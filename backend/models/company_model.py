"""
Company collection database operations.

What this file is for:
Contains all MongoDB queries for the `companies` collection.
Controllers call these functions and never write raw database queries.

Collection schema:
- _id: ObjectId
- name: str
- owner_user_id: ObjectId
- created_at: datetime (UTC)
"""

from typing import Any, Optional
from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase
from utils.helpers import now_utc


async def find_company_by_id(db: AsyncDatabase, company_id: ObjectId) -> Optional[dict[str, Any]]:
    """
    Finds a company document by its MongoDB ObjectId.

    Returns:
        The company dictionary if found, or None.
    """
    query: dict[str, Any] = {"_id": company_id}
    company_doc: Optional[dict[str, Any]] = await db["companies"].find_one(query)
    return company_doc


async def find_company_by_owner_id(db: AsyncDatabase, owner_user_id: ObjectId) -> Optional[dict[str, Any]]:
    """
    Finds a company document owned by a specific user.

    Returns:
        The company dictionary if found, or None.
    """
    query: dict[str, Any] = {"owner_user_id": owner_user_id}
    company_doc: Optional[dict[str, Any]] = await db["companies"].find_one(query)
    return company_doc


async def create_company_doc(
    db: AsyncDatabase,
    name: str,
    owner_user_id: ObjectId
) -> dict[str, Any]:
    """
    Inserts a new company document into MongoDB.

    Returns:
        The newly inserted company document.
    """
    current_time = now_utc()
    company_document: dict[str, Any] = {
        "name": name.strip(),
        "owner_user_id": owner_user_id,
        "created_at": current_time,
    }

    insert_result = await db["companies"].insert_one(company_document)
    new_id = insert_result.inserted_id

    created_company: Optional[dict[str, Any]] = await db["companies"].find_one({"_id": new_id})
    if created_company is None:
        raise RuntimeError("Failed to retrieve company after insert")

    return created_company
