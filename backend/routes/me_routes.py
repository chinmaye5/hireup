"""
Me route declarations.

What this file is for:
Declares URL paths for the /api/me endpoint and applies authentication.
No business logic here: delegates directly to me_controller.
"""

from typing import Any
from fastapi import APIRouter, Depends
from pymongo.asynchronous.database import AsyncDatabase
from config.db import get_db
from middleware.auth_middleware import get_current_user
from controllers import me_controller

router = APIRouter(tags=["Me"])


@router.get("/me")
async def get_me_route(
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db)
) -> dict[str, Any]:
    """
    Returns authenticated user profile and company info.
    """
    result = await me_controller.get_me(current_user=current_user, db=db)
    return result
