"""
LiveKit token generation service.

What this file is for:
Creates short-lived WebRTC access tokens for candidates joining their AI interview room.
Talks to the LiveKit Python SDK (`livekit-api`).
"""

from datetime import timedelta
from livekit import api
from config.settings import LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL


def create_livekit_token(
    room_name: str,
    candidate_clerk_id: str,
    candidate_name: str,
    time_limit_min: int
) -> str:
    """
    Creates a scoped LiveKit WebRTC JWT access token for a candidate.

    Security boundaries:
    - Scoped strictly to one room: room_name
    - Grants room_join=True, can_publish=True, can_subscribe=True
    - Custom TTL = time_limit_min + 5 minutes (prevents long-lived lingering access)

    Returns:
        The generated JWT token string.
    """
    # Step 1: Calculate short-lived TTL
    ttl_duration = timedelta(minutes=time_limit_min + 5)

    # Step 2: Build video grants strictly for this room
    grants = api.VideoGrants(
        room_join=True,
        room=room_name,
        can_publish=True,
        can_subscribe=True,
    )

    # Step 3: Instantiate and configure the access token
    display_name = candidate_name.strip()
    if len(display_name) == 0:
        display_name = "Candidate"

    token_builder = api.AccessToken(
        LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET,
    )
    token_builder = token_builder.with_identity(candidate_clerk_id)
    token_builder = token_builder.with_name(display_name)
    token_builder = token_builder.with_grants(grants)
    token_builder = token_builder.with_ttl(ttl_duration)

    # Step 4: Mint JWT
    jwt_token = token_builder.to_jwt()
    return jwt_token
