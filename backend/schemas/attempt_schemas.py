"""
Pydantic schemas for Attempt requests and responses.

What this file is for:
Validates recruiter candidate invitations and structures attempt detail responses.
"""

from typing import Any, Optional
from pydantic import BaseModel, EmailStr, Field
from utils.constants import MAX_INVITE_EMAILS


class InviteCandidatesRequest(BaseModel):
    """Payload to invite a list of candidate emails to an interview."""
    emails: list[EmailStr] = Field(
        min_length=1,
        max_length=MAX_INVITE_EMAILS,
        description="Candidate email addresses to invite",
    )


class InviteCandidatesResponse(BaseModel):
    """Result of inviting candidates showing created vs skipped emails."""
    created: list[str]
    skipped: list[str]
