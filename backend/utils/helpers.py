"""
Helper utility functions for the backend.

What this file is for:
Common utility functions used across models, controllers, and services.
Provides email normalization, UTC time generation, and safe ObjectId conversion.
"""

from datetime import datetime, timezone
from typing import Optional
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
