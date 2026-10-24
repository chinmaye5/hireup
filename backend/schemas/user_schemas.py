"""
Pydantic schemas for User requests and responses.

What this file is for:
Defines the structure and validation rules for User-related API endpoints.
Similar to Joi or express-validator schemas in an Express app.
"""

from typing import Optional
from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    """Shape of the user profile returned by GET /api/me"""
    id: str
    clerk_id: str
    email: EmailStr
    name: Optional[str] = None
    company_id: Optional[str] = None
    created_at: Optional[str] = None
