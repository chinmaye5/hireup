"""
Tests for helper functions in utils.helpers.
"""

from bson import ObjectId
from utils.helpers import normalize_email, now_utc, to_object_id


def test_normalize_email_lowercases_and_trims():
    """Checks that emails are stripped of whitespace and converted to lowercase."""
    raw = "  Candidate.Test@EXAMPLE.com  "
    normalized = normalize_email(raw)
    assert normalized == "candidate.test@example.com"


def test_to_object_id_valid():
    """Checks that a 24-character hex string converts to an ObjectId."""
    hex_str = "507f1f77bcf86cd799439011"
    oid = to_object_id(hex_str)
    assert oid is not None
    assert str(oid) == hex_str


def test_to_object_id_invalid():
    """Checks that invalid string formats return None safely."""
    invalid_str = "not-a-valid-id"
    oid = to_object_id(invalid_str)
    assert oid is None


def test_now_utc():
    """Checks that now_utc returns a timezone-aware datetime."""
    t = now_utc()
    assert t.tzinfo is not None
