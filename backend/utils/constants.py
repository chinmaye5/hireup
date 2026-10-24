"""
Constants used across the HireUp backend.

This file defines fixed values like attempt statuses and validation limits,
preventing typos and ensuring all layers share the same exact definitions.
"""

# Attempt status values
STATUS_INVITED: str = "invited"
STATUS_IN_PROGRESS: str = "in_progress"
STATUS_COMPLETED: str = "completed"
STATUS_ABANDONED: str = "abandoned"
STATUS_SCORED: str = "scored"
STATUS_SCORE_FAILED: str = "score_failed"

ALL_STATUSES: list[str] = [
    STATUS_INVITED,
    STATUS_IN_PROGRESS,
    STATUS_COMPLETED,
    STATUS_ABANDONED,
    STATUS_SCORED,
    STATUS_SCORE_FAILED,
]

# Validation limits
MIN_TITLE_LENGTH: int = 3
MAX_TITLE_LENGTH: int = 120
MIN_QUESTIONS: int = 1
MAX_QUESTIONS: int = 10
MIN_QUESTION_TEXT_LENGTH: int = 1
MAX_QUESTION_TEXT_LENGTH: int = 300
MAX_RUBRIC_LENGTH: int = 500
MIN_TIME_LIMIT_MINUTES: int = 5
MAX_TIME_LIMIT_MINUTES: int = 60
MAX_INVITE_EMAILS: int = 50
