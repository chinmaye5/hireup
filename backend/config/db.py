"""
Database connection and index configuration for MongoDB Atlas.

What this file is for:
Creates and manages the single shared PyMongo AsyncMongoClient for FastAPI.
Provides the `get_db` FastAPI dependency (works like passing db down to routes).
Contains `create_indexes` to ensure performance and uniqueness rules.
"""

from typing import AsyncGenerator
from pymongo import AsyncMongoClient, ASCENDING, DESCENDING
from pymongo.asynchronous.database import AsyncDatabase
from config.settings import MONGODB_URI, MONGODB_DB_NAME

# Global shared client instance for the FastAPI application
_mongo_client: AsyncMongoClient | None = None


def get_mongo_client() -> AsyncMongoClient:
    """
    Returns the initialized AsyncMongoClient instance.
    Raises RuntimeError if called before startup.
    """
    if _mongo_client is None:
        raise RuntimeError("Database client is not initialized yet. App lifespan may not have started.")
    return _mongo_client


async def init_db() -> AsyncMongoClient:
    """
    Initializes the AsyncMongoClient at application startup.
    Also creates all necessary database indexes.

    Returns:
        The initialized AsyncMongoClient.
    """
    global _mongo_client
    # Step 1: Create client connection
    _mongo_client = AsyncMongoClient(MONGODB_URI)

    # Step 2: Ensure indexes exist
    db: AsyncDatabase = _mongo_client[MONGODB_DB_NAME]
    await create_indexes(db)

    return _mongo_client


async def close_db() -> None:
    """
    Closes the AsyncMongoClient at application shutdown.
    """
    global _mongo_client
    if _mongo_client is not None:
        await _mongo_client.close()
        _mongo_client = None


async def get_db() -> AsyncGenerator[AsyncDatabase, None]:
    """
    FastAPI dependency that provides the database to route controllers.
    Works like middleware injecting `req.db` in an Express application.
    """
    client: AsyncMongoClient = get_mongo_client()
    db: AsyncDatabase = client[MONGODB_DB_NAME]
    yield db


async def create_indexes(db: AsyncDatabase) -> None:
    """
    Creates indexes across all collections with comments explaining their purposes.
    """
    # 1. users collection:
    # clerk_id must be unique so that one Clerk user corresponds to exactly one user document.
    await db["users"].create_index(
        [("clerk_id", ASCENDING)],
        unique=True,
        name="idx_users_clerk_id_unique"
    )

    # 2. interviews collection:
    # company_id + created_at allows recruiters to quickly fetch their company's interviews in reverse order.
    await db["interviews"].create_index(
        [("company_id", ASCENDING), ("created_at", DESCENDING)],
        name="idx_interviews_company_created"
    )

    # 3. attempts collection:
    # (interview_id, email) must be unique to prevent inviting the same candidate email twice to the same interview.
    await db["attempts"].create_index(
        [("interview_id", ASCENDING), ("email", ASCENDING)],
        unique=True,
        name="idx_attempts_interview_email_unique"
    )

    # (company_id, interview_id) allows fast filtering on the recruiter dashboard.
    await db["attempts"].create_index(
        [("company_id", ASCENDING), ("interview_id", ASCENDING)],
        name="idx_attempts_company_interview"
    )

    # email allows candidates to quickly query all attempts assigned to their verified emails in "My Interviews".
    await db["attempts"].create_index(
        [("email", ASCENDING)],
        name="idx_attempts_email"
    )
