"""
Authentication middleware for FastAPI routes.

What this file is for:
Provides `get_current_user` and `require_company_user` dependencies.
In FastAPI, `Depends(...)` works just like Express middleware:
it runs before the controller logic, checks permissions, and passes
the user data into the controller function as an argument.
"""

from typing import Any
from bson import ObjectId
from fastapi import Depends, HTTPException, Request, status
from pymongo.asynchronous.database import AsyncDatabase
from config.db import get_db
from models import user_model
from services import clerk_service


async def get_current_user(
    request: Request,
    db: AsyncDatabase = Depends(get_db)
) -> dict[str, Any]:
    """
    FastAPI dependency that authenticates incoming requests using Clerk.

    Steps performed:
    1. Reads the Authorization header. Raises 401 if missing.
    2. Verifies the token using Clerk SDK's authenticate_clerk_request.
    3. Retrieves the Clerk user ID from the verified token.
    4. Fetches the user profile from Clerk to retrieve verified emails.
    5. Upserts the local user document in MongoDB.
    6. Returns the current user context dictionary.

    Returns:
        dict containing:
        - "clerk_id": str
        - "user_id": ObjectId
        - "name": str | None
        - "primary_email": str
        - "verified_emails": list[str]
        - "company_id": ObjectId | None
    """
    # Step 1: Read Authorization header
    auth_header = request.headers.get("authorization")
    if auth_header is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header"
        )

    # Step 2: Verify Clerk token using official Clerk SDK
    # We pass request.headers converted to a plain dict
    headers_dict = dict(request.headers)
    request_state = clerk_service.authenticate_clerk_request(headers_dict)

    if not request_state.is_authenticated:
        detail_msg = "Invalid or expired session token"
        if request_state.message is not None:
            detail_msg = request_state.message
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail_msg
        )

    # Step 3: Extract Clerk user ID from verified token payload
    payload = request_state.payload
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing"
        )

    clerk_user_id = payload.get("sub")
    if clerk_user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User identifier missing in token"
        )

    # Step 4: Fetch user details from Clerk API (name + verified emails)
    # TODO: Add in-memory or Redis caching for user profile to reduce Clerk API calls
    clerk_info = await clerk_service.fetch_clerk_user_info(clerk_user_id)
    user_name = clerk_info.get("name")
    primary_email = clerk_info.get("primary_email", "")
    verified_emails = clerk_info.get("verified_emails", [])

    # Step 5: Upsert local user record in MongoDB
    user_doc = await user_model.upsert_user_from_clerk(
        db=db,
        clerk_id=clerk_user_id,
        primary_email=primary_email,
        name=user_name,
    )

    raw_user_id = user_doc["_id"]
    company_id_val = user_doc.get("company_id")

    # Step 6: Return clean authenticated user context
    current_user_context: dict[str, Any] = {
        "clerk_id": clerk_user_id,
        "user_id": raw_user_id,
        "name": user_name,
        "primary_email": primary_email,
        "verified_emails": verified_emails,
        "company_id": company_id_val,
    }
    return current_user_context


async def require_company_user(
    current_user: dict[str, Any] = Depends(get_current_user)
) -> dict[str, Any]:
    """
    Dependency that enforces the user belongs to a company (recruiter role).
    Raises HTTP 403 Forbidden if user has not created or joined a company yet.
    """
    company_id = current_user.get("company_id")
    if company_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Create a company first"
        )
    return current_user
