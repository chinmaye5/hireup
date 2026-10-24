"""
Company route declarations.

What this file is for:
Declares URL paths for company operations.
No business logic here: delegates directly to company_controller.
"""

from typing import Any
from fastapi import APIRouter, Depends, status
from pymongo.asynchronous.database import AsyncDatabase
from config.db import get_db
from middleware.auth_middleware import get_current_user
from schemas.company_schemas import CreateCompanyRequest
from controllers import company_controller

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_company_route(
    payload: CreateCompanyRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db)
) -> dict[str, Any]:
    """
    Creates a new company owned by the authenticated user.
    """
    result = await company_controller.create_company(
        payload=payload,
        current_user=current_user,
        db=db
    )
    return result
