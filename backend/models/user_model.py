"""
User collection database operations.

What this file is for:
Contains all MongoDB queries for the `users` collection.
Controllers call these functions and never write raw database queries.

Collection schema:
- _id: ObjectId
- clerk_id: str (unique)
- email: str (primary email, lowercase)
- name: str | None
- company_id: ObjectId | None (null until recruiter creates a company)
- created_at: datetime (UTC)
"""

from typing import Any, Optional
from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase
from utils.helpers import now_utc, normalize_email


async def find_user_by_clerk_id(db: AsyncDatabase, clerk_id: str) -> Optional[dict[str, Any]]:
    """
    Finds a user document by Clerk user ID.

    Returns:
        The user dictionary if found, or None.
    """
    query: dict[str, Any] = {"clerk_id": clerk_id}
    user_doc: Optional[dict[str, Any]] = await db["users"].find_one(query)
    return user_doc


async def find_user_by_id(db: AsyncDatabase, user_id: ObjectId) -> Optional[dict[str, Any]]:
    """
    Finds a user document by its MongoDB ObjectId.

    Returns:
        The user dictionary if found, or None.
    """
    query: dict[str, Any] = {"_id": user_id}
    user_doc: Optional[dict[str, Any]] = await db["users"].find_one(query)
    return user_doc


async def upsert_user_from_clerk(
    db: AsyncDatabase,
    clerk_id: str,
    primary_email: str,
    name: Optional[str]
) -> dict[str, Any]:
    """
    Upserts a user record from Clerk:
    - If user exists: updates name and primary email.
    - If user does not exist: inserts with company_id=None and created_at=now.

    Returns:
        The updated or newly created user document.
    """
    cleaned_email: str = normalize_email(primary_email)
    current_time = now_utc()

    filter_query: dict[str, Any] = {"clerk_id": clerk_id}

    set_fields: dict[str, Any] = {
        "email": cleaned_email,
        "name": name,
    }

    set_on_insert_fields: dict[str, Any] = {
        "clerk_id": clerk_id,
        "company_id": None,
        "created_at": current_time,
    }

    update_operation: dict[str, Any] = {
        "$set": set_fields,
        "$setOnInsert": set_on_insert_fields,
    }

    await db["users"].update_one(filter_query, update_operation, upsert=True)

    updated_user: Optional[dict[str, Any]] = await db["users"].find_one(filter_query)
    if updated_user is None:
        raise RuntimeError("Failed to retrieve user after upserting from Clerk")

    return updated_user


async def update_user_company_id(
    db: AsyncDatabase,
    user_id: ObjectId,
    company_id: ObjectId
) -> None:
    """
    Assigns a company_id to the user record.
    """
    filter_query: dict[str, Any] = {"_id": user_id}
    update_operation: dict[str, Any] = {"$set": {"company_id": company_id}}
    await db["users"].update_one(filter_query, update_operation)
