"""
Pydantic schemas for Interview requests and responses.

What this file is for:
Defines request validation and response formatting for Recruiter Interview management.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from utils.constants import (
    MIN_TITLE_LENGTH,
    MAX_TITLE_LENGTH,
    MIN_QUESTIONS,
    MAX_QUESTIONS,
    MIN_QUESTION_TEXT_LENGTH,
    MAX_QUESTION_TEXT_LENGTH,
    MAX_RUBRIC_LENGTH,
    MIN_TIME_LIMIT_MINUTES,
    MAX_TIME_LIMIT_MINUTES,
)


class QuestionItem(BaseModel):
    """A single question in an interview with an optional scoring rubric."""
    text: str = Field(
        min_length=MIN_QUESTION_TEXT_LENGTH,
        max_length=MAX_QUESTION_TEXT_LENGTH,
        description="The question prompt spoken by the voice agent",
    )
    rubric: Optional[str] = Field(
        default=None,
        max_length=MAX_RUBRIC_LENGTH,
        description="Optional evaluation criteria for scoring this question",
    )


class CreateInterviewRequest(BaseModel):
    """Payload sent by a recruiter to create a new interview template."""
    title: str = Field(
        min_length=MIN_TITLE_LENGTH,
        max_length=MAX_TITLE_LENGTH,
        description="Role or interview title",
    )
    questions: list[QuestionItem] = Field(
        min_length=MIN_QUESTIONS,
        max_length=MAX_QUESTIONS,
        description="List of questions asked sequentially",
    )
    expires_at: datetime = Field(
        description="Expiration datetime in UTC after which attempts cannot be started",
    )
    time_limit_min: int = Field(
        ge=MIN_TIME_LIMIT_MINUTES,
        le=MAX_TIME_LIMIT_MINUTES,
        description="Interview duration limit in minutes",
    )


class InterviewSummaryResponse(BaseModel):
    """Summary item returned in the list of company interviews."""
    id: str
    company_id: str
    title: str
    time_limit_min: int
    expires_at: str
    created_at: str
    status_counts: dict[str, int]
