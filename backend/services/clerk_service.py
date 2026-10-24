"""
Clerk integration service.

What this file is for:
Talks to Clerk's Backend API using the official `clerk-backend-api` SDK.
Verifies incoming tokens and fetches user information including verified email addresses.
"""

from typing import Any, Optional
from clerk_backend_api import Clerk
from clerk_backend_api.security import AuthenticateRequestOptions, RequestState
from config.settings import CLERK_SECRET_KEY, FRONTEND_ORIGINS
from utils.helpers import normalize_email

# Shared Clerk client instance configured with the secret key
clerk_client = Clerk(bearer_auth=CLERK_SECRET_KEY)


class RequestAdapter:
    """
    Simple adapter to satisfy Clerk's Requestish protocol.
    Clerk expects an object with a `headers` mapping.
    """
    def __init__(self, headers: dict[str, str]) -> None:
        self.headers: dict[str, str] = headers


def authenticate_clerk_request(headers_dict: dict[str, str]) -> RequestState:
    """
    Verifies a Clerk session token from the request headers using the official Clerk SDK.

    Returns:
        A RequestState instance indicating whether the request is signed in.
    """
    # Step 1: Wrap headers in the adapter
    adapted_request = RequestAdapter(headers=headers_dict)

    # Step 2: Build authentication options
    # We pass the authorized parties (origins) so tokens are verified for our frontend.
    auth_options = AuthenticateRequestOptions(
        secret_key=CLERK_SECRET_KEY,
        authorized_parties=FRONTEND_ORIGINS,
    )

    # Step 3: Call Clerk SDK to verify
    request_state: RequestState = clerk_client.authenticate_request(
        adapted_request,
        auth_options,
    )
    return request_state


async def fetch_clerk_user_info(clerk_user_id: str) -> dict[str, Any]:
    """
    Fetches the user details directly from Clerk Backend API.
    Extracts the user's name and all VERIFIED email addresses.

    Returns:
        A dict with:
        - "name": str | None
        - "primary_email": str
        - "verified_emails": list[str] (all lowercased)
    """
    # Step 1: Call Clerk API to get the user
    user_record = await clerk_client.users.get_async(user_id=clerk_user_id)

    # Step 2: Extract display name
    first_name: Optional[str] = user_record.first_name
    last_name: Optional[str] = user_record.last_name
    full_name_parts: list[str] = []
    if first_name is not None and len(first_name.strip()) > 0:
        full_name_parts.append(first_name.strip())
    if last_name is not None and len(last_name.strip()) > 0:
        full_name_parts.append(last_name.strip())

    name: Optional[str] = None
    if len(full_name_parts) > 0:
        name = " ".join(full_name_parts)

    # Step 3: Extract verified email addresses only
    verified_emails: list[str] = []
    primary_email: str = ""
    primary_email_id: Optional[str] = user_record.primary_email_address_id

    raw_email_list = user_record.email_addresses
    for email_obj in raw_email_list:
        raw_address = email_obj.email_address
        cleaned_address = normalize_email(raw_address)

        # Check if email is verified
        is_verified = False
        verification_obj = email_obj.verification
        if verification_obj is not None:
            # Otp or OAuth verification status
            status_val = getattr(verification_obj, "status", None)
            status_str = str(status_val)
            if "verified" in status_str.lower():
                is_verified = True

        if is_verified:
            if cleaned_address not in verified_emails:
                verified_emails.append(cleaned_address)

        # Identify primary email address
        if email_obj.id == primary_email_id:
            primary_email = cleaned_address

    # Fallback if primary_email was not explicitly marked verified
    if len(primary_email) == 0 and len(verified_emails) > 0:
        primary_email = verified_emails[0]
    elif len(primary_email) > 0 and primary_email not in verified_emails:
        verified_emails.append(primary_email)

    result_data: dict[str, Any] = {
        "name": name,
        "primary_email": primary_email,
        "verified_emails": verified_emails,
    }
    return result_data
