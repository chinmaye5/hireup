"""
Serializers to convert raw MongoDB documents into clean JSON-serializable dictionaries.

What this file is for:
MongoDB stores identifiers as BSON ObjectId instances and dates as datetime objects.
This file provides plain helper functions that convert these into standard strings
and dictionaries ready for API responses, without hidden magic.
"""

from typing import Any, Optional
from bson import ObjectId


def serialize_id(value: Any) -> Optional[str]:
    """
    Converts a MongoDB ObjectId or string into a plain string.

    Returns:
        String representation or None.
    """
    if value is None:
        return None
    if isinstance(value, ObjectId):
        return str(value)
    return str(value)


def serialize_datetime(value: Any) -> Optional[str]:
    """
    Converts a datetime object to an ISO format string.
    """
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def serialize_user(doc: Optional[dict[str, Any]]) -> Optional[dict[str, Any]]:
    """
    Serializes a raw user document from MongoDB into a plain dictionary.
    """
    if doc is None:
        return None

    serialized: dict[str, Any] = {
        "id": serialize_id(doc.get("_id")),
        "clerk_id": doc.get("clerk_id"),
        "email": doc.get("email"),
        "name": doc.get("name"),
        "company_id": serialize_id(doc.get("company_id")),
        "created_at": serialize_datetime(doc.get("created_at")),
    }
    return serialized


def serialize_company(doc: Optional[dict[str, Any]]) -> Optional[dict[str, Any]]:
    """
    Serializes a raw company document from MongoDB into a plain dictionary.
    """
    if doc is None:
        return None

    serialized: dict[str, Any] = {
        "id": serialize_id(doc.get("_id")),
        "name": doc.get("name"),
        "owner_user_id": serialize_id(doc.get("owner_user_id")),
        "created_at": serialize_datetime(doc.get("created_at")),
    }
    return serialized


def serialize_interview_summary(
    doc: dict[str, Any],
    status_counts: Optional[dict[str, int]] = None
) -> dict[str, Any]:
    """
    Serializes an interview document for the recruiter interview list.
    """
    counts = status_counts
    if counts is None:
        counts = {}

    return {
        "id": serialize_id(doc.get("_id")),
        "company_id": serialize_id(doc.get("company_id")),
        "title": doc.get("title"),
        "time_limit_min": doc.get("time_limit_min"),
        "expires_at": serialize_datetime(doc.get("expires_at")),
        "created_at": serialize_datetime(doc.get("created_at")),
        "status_counts": counts,
    }


def serialize_interview_detail(
    interview_doc: dict[str, Any],
    attempts_list: list[dict[str, Any]]
) -> dict[str, Any]:
    """
    Serializes an interview template and its associated attempts list for the recruiter.
    """
    serialized_attempts: list[dict[str, Any]] = []
    for att in attempts_list:
        raw_result = att.get("result")
        res_summary = None
        overall_score = None
        recommendation = None
        if raw_result is not None:
            overall_score = raw_result.get("overall_score")
            recommendation = raw_result.get("recommendation")
            res_summary = raw_result.get("summary")

        serialized_attempts.append({
            "id": serialize_id(att.get("_id")),
            "email": att.get("email"),
            "status": att.get("status"),
            "started_at": serialize_datetime(att.get("started_at")),
            "ended_at": serialize_datetime(att.get("ended_at")),
            "expires_at": serialize_datetime(att.get("expires_at")),
            "created_at": serialize_datetime(att.get("created_at")),
            "overall_score": overall_score,
            "recommendation": recommendation,
            "summary": res_summary,
        })

    return {
        "id": serialize_id(interview_doc.get("_id")),
        "company_id": serialize_id(interview_doc.get("company_id")),
        "title": interview_doc.get("title"),
        "questions": interview_doc.get("questions", []),
        "time_limit_min": interview_doc.get("time_limit_min"),
        "expires_at": serialize_datetime(interview_doc.get("expires_at")),
        "created_at": serialize_datetime(interview_doc.get("created_at")),
        "attempts": serialized_attempts,
    }


def serialize_attempt_detail(doc: Optional[dict[str, Any]]) -> Optional[dict[str, Any]]:
    """
    Serializes a full attempt document for the recruiter (including transcript and score).
    """
    if doc is None:
        return None

    # Format transcript items
    raw_transcript = doc.get("transcript", [])
    formatted_transcript: list[dict[str, Any]] = []
    for item in raw_transcript:
        formatted_transcript.append({
            "role": item.get("role"),
            "text": item.get("text"),
            "timestamp": serialize_datetime(item.get("timestamp")),
        })

    return {
        "id": serialize_id(doc.get("_id")),
        "interview_id": serialize_id(doc.get("interview_id")),
        "company_id": serialize_id(doc.get("company_id")),
        "email": doc.get("email"),
        "interview_title": doc.get("interview_title"),
        "company_name": doc.get("company_name"),
        "questions_snapshot": doc.get("questions_snapshot", []),
        "time_limit_min": doc.get("time_limit_min"),
        "expires_at": serialize_datetime(doc.get("expires_at")),
        "status": doc.get("status"),
        "started_at": serialize_datetime(doc.get("started_at")),
        "ended_at": serialize_datetime(doc.get("ended_at")),
        "candidate_clerk_id": doc.get("candidate_clerk_id"),
        "transcript": formatted_transcript,
        "result": doc.get("result"),
        "result_error": doc.get("result_error"),
        "created_at": serialize_datetime(doc.get("created_at")),
    }
