"""
Company controller.

What this file is for:
Handles logic for creating a company by an authenticated user.
Enforces business rule: each user can only create/own one company.
"""

from typing import Any
from fastapi import HTTPException, status
from pymongo.asynchronous.database import AsyncDatabase
from models import company_model, user_model
from schemas.company_schemas import CreateCompanyRequest
from utils.serializers import serialize_company


async def create_company(
    payload: CreateCompanyRequest,
    current_user: dict[str, Any],
    db: AsyncDatabase
) -> dict[str, Any]:
    """
    Creates a new company and links it to the current user.
    Raises HTTP 409 Conflict if the user already has a company.

    Returns:
        The serialized created company document.
    """
    user_id = current_user["user_id"]

    # Step 1: Check if user already owns or belongs to a company
    existing_company_id = current_user.get("company_id")
    if existing_company_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already has a company"
        )

    # Step 2: Insert new company document
    clean_name = payload.name.strip()
    company_doc = await company_model.create_company_doc(
        db=db,
        name=clean_name,
        owner_user_id=user_id,
    )

    # Step 3: Update user document with the new company_id
    new_company_id = company_doc["_id"]
    await user_model.update_user_company_id(
        db=db,
        user_id=user_id,
        company_id=new_company_id,
    )

    # Step 4: Return serialized company
    serialized = serialize_company(company_doc)
    return serialized
