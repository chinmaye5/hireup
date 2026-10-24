"""
Pydantic schemas for Company requests and responses.

What this file is for:
Validates the request payload when creating a company, and formats the response.
"""

from typing import Optional
from pydantic import BaseModel, Field


class CreateCompanyRequest(BaseModel):
    """Payload sent by a recruiter to create a new company."""
    name: str = Field(min_length=2, max_length=100, description="Company name")


class CompanyResponse(BaseModel):
    """Shape of the company returned in API responses."""
    id: str
    name: str
    owner_user_id: str
    created_at: Optional[str] = None
