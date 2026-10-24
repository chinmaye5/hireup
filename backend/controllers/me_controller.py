"""
Me controller.

What this file is for:
Handles requests to GET /api/me.
Fetches the current authenticated user's profile and their company details if present.
"""

from typing import Any, Optional
from pymongo.asynchronous.database import AsyncDatabase
from models import user_model, company_model
from utils.serializers import serialize_user, serialize_company


async def get_me(
    current_user: dict[str, Any],
    db: AsyncDatabase
) -> dict[str, Any]:
    """
    Returns the authenticated user's record and their company (or None).

    Returns:
        dict with "user" and "company".
    """
    # Step 1: Look up full user document
    user_id = current_user["user_id"]
    user_doc = await user_model.find_user_by_id(db, user_id)
    serialized_user = serialize_user(user_doc)

    # Step 2: Look up company if user is assigned to one
    company_id = current_user.get("company_id")
    serialized_company: Optional[dict[str, Any]] = None
    if company_id is not None:
        company_doc = await company_model.find_company_by_id(db, company_id)
        serialized_company = serialize_company(company_doc)

    return {
        "user": serialized_user,
        "company": serialized_company,
    }
