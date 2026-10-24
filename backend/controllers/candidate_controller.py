"""
Candidate controller.

What this file is for:
Handles candidate actions:
- Listing attempts assigned to the candidate's verified emails (GET /api/my-attempts)
- The security-critical start gate (POST /api/attempts/{attempt_id}/start)
"""

from typing import Any
from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.asynchronous.database import AsyncDatabase
from config.settings import LIVEKIT_URL
from models import attempt_model
from services import livekit_service
from utils.constants import STATUS_INVITED
from utils.helpers import to_object_id, now_utc, normalize_email
from utils.serializers import serialize_id, serialize_datetime


async def get_my_attempts(
    current_user: dict[str, Any],
    db: AsyncDatabase
) -> list[dict[str, Any]]:
    """
    Returns candidate attempts matching any of the user's verified Clerk emails.
    Never returns transcripts or scores to candidates.

    Returns:
        List of attempt summaries:
        {attempt_id, company_name, interview_title, status, expires_at, time_limit_min}
    """
    verified_emails = current_user.get("verified_emails", [])
    if len(verified_emails) == 0:
        return []

    attempts = await attempt_model.find_attempts_by_emails(db, verified_emails)

    formatted_list: list[dict[str, Any]] = []
    for att in attempts:
        formatted_list.append({
            "attempt_id": serialize_id(att.get("_id")),
            "company_name": att.get("company_name"),
            "interview_title": att.get("interview_title"),
            "status": att.get("status"),
            "time_limit_min": att.get("time_limit_min"),
            "expires_at": serialize_datetime(att.get("expires_at")),
            "created_at": serialize_datetime(att.get("created_at")),
        })

    return formatted_list


async def start_attempt(
    attempt_id_str: str,
    current_user: dict[str, Any],
    db: AsyncDatabase
) -> dict[str, Any]:
    """
    The security-critical candidate start gate.

    Steps performed:
    1. Reads verified_emails and clerk_id from current_user.
    2. Converts attempt_id to an ObjectId (invalid -> 404).
    3. Runs an atomic find_one_and_update (start_attempt_if_allowed):
       - If successful, sets status to 'in_progress', started_at to now, candidate_clerk_id.
    4. If no document was updated, queries the attempt by ID to diagnose the reason:
       - Not found OR candidate's verified emails don't match -> 404 "Interview not found"
       - Expired -> 410 "This interview link has expired"
       - Any other status (already started/completed) -> 409 "This interview was already started or finished"
    5. Calls livekit_service to generate a scoped JWT token for the room `attempt-<attempt_id>`.
    6. If token generation throws an error, sets the attempt back to 'invited' so it's not burned.
    7. Returns { "token": ..., "url": ..., "room_name": ... }.
    """
    # Step 1: Extract verified emails and Clerk ID
    verified_emails = current_user.get("verified_emails", [])
    clerk_id = current_user["clerk_id"]
    candidate_name = current_user.get("name")
    if candidate_name is None:
        candidate_name = "Candidate"

    # Step 2: Validate ObjectId
    attempt_id = to_object_id(attempt_id_str)
    if attempt_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    # Step 3: Run single atomic find_one_and_update
    # Atomicity prevents two browser tabs from both starting the same attempt.
    started_attempt = await attempt_model.start_attempt_if_allowed(
        db=db,
        attempt_id=attempt_id,
        verified_emails=verified_emails,
        candidate_clerk_id=clerk_id,
    )

    # Step 4: If nothing matched, diagnose the exact failure reason
    if started_attempt is None:
        diagnostic_doc = await attempt_model.find_attempt_by_id_only(db, attempt_id)
        if diagnostic_doc is None:
            # Document does not exist in database
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview not found"
            )

        # Check if the candidate's verified emails include the invited email
        invited_email = normalize_email(diagnostic_doc.get("email", ""))
        normalized_verified: list[str] = []
        for em in verified_emails:
            normalized_verified.append(normalize_email(em))

        if invited_email not in normalized_verified:
            # Privacy rule: never reveal that an attempt exists if the email doesn't match
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview not found"
            )

        # Check if the attempt is expired
        expires_at = diagnostic_doc.get("expires_at")
        current_time = now_utc()
        if expires_at is not None and current_time >= expires_at:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="This interview link has expired"
            )

        # Check if the attempt was already started or completed
        current_status = diagnostic_doc.get("status")
        if current_status != STATUS_INVITED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This interview was already started or finished"
            )

        # Fallback catch-all if no specific rule matched
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    # Step 5: Mint LiveKit WebRTC Access Token
    room_name = f"attempt-{str(attempt_id)}"
    time_limit_min = started_attempt.get("time_limit_min", 30)

    try:
        token = livekit_service.create_livekit_token(
            room_name=room_name,
            candidate_clerk_id=clerk_id,
            candidate_name=candidate_name,
            time_limit_min=time_limit_min,
        )
    except Exception as exc:
        # Step 6: On token creation error, revert status back to 'invited' so it's not burned
        await attempt_model.revert_attempt_to_invited(db, attempt_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate voice interview token. Please try again."
        ) from exc

    # Step 7: Return livekit connection credentials
    return {
        "token": token,
        "url": LIVEKIT_URL,
        "room_name": room_name,
    }
