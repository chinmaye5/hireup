"""
Helper utility functions for the backend.

What this file is for:
Common utility functions used across models, controllers, and services.
Provides email normalization, UTC time generation, and safe ObjectId conversion.
"""

from datetime import datetime, timezone
from typing import Optional, Any
from bson import ObjectId


def normalize_email(email_address: str) -> str:
    """
    Trims leading/trailing whitespace and converts an email to lowercase.

    Returns:
        The normalized lowercase email string.
    """
    trimmed: str = email_address.strip()
    lowercased: str = trimmed.lower()
    return lowercased


def now_utc() -> datetime:
    """
    Returns the current date and time in UTC timezone.

    Returns:
        A timezone-aware UTC datetime.
    """
    return datetime.now(timezone.utc)


def to_object_id(id_string: str) -> Optional[ObjectId]:
    """
    Safely converts a string to a MongoDB ObjectId.

    Returns:
        The ObjectId instance if valid, or None if invalid.
    """
    is_valid: bool = ObjectId.is_valid(id_string)
    if is_valid:
        converted_id: ObjectId = ObjectId(id_string)
        return converted_id
    else:
        return None


def is_past_date(target_date: Any) -> bool:
    """
    Safely checks if target_date has passed, handling both offset-naive and offset-aware datetimes.
    """
    if target_date is None:
        return False

    if isinstance(target_date, str):
        try:
            target_date = datetime.fromisoformat(target_date.replace("Z", "+00:00"))
        except Exception:
            return False

    current_time = datetime.now(timezone.utc)
    if getattr(target_date, "tzinfo", None) is None:
        target_date = target_date.replace(tzinfo=timezone.utc)

    return current_time >= target_date

