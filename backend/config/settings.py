"""
Application configuration and environment variable loading.

What this file is for:
Loads settings from environment variables (.env).
Provides a helper function that raises a clear error if any required variable is missing.
"""

import os
from typing import Optional
from dotenv import load_dotenv

# Step 1: Load variables from .env file into os.environ
load_dotenv()


def get_required_env(key_name: str) -> str:
    """
    Reads an environment variable by name.
    Raises RuntimeError naming the missing variable if not set or empty.

    Returns:
        The environment variable value as a string.
    """
    value: Optional[str] = os.getenv(key_name)
    if value is None:
        error_message: str = f"Missing required environment variable: '{key_name}'"
        raise RuntimeError(error_message)
    trimmed_value: str = value.strip()
    if len(trimmed_value) == 0:
        error_message = f"Environment variable '{key_name}' cannot be empty"
        raise RuntimeError(error_message)
    return trimmed_value


def get_optional_env(key_name: str, default_value: str) -> str:
    """
    Reads an optional environment variable with a fallback default.

    Returns:
        The environment variable value or the default.
    """
    value: Optional[str] = os.getenv(key_name)
    if value is None:
        return default_value
    trimmed_value: str = value.strip()
    if len(trimmed_value) == 0:
        return default_value
    return trimmed_value


# Database Settings
MONGODB_URI: str = get_required_env("MONGODB_URI")
MONGODB_DB_NAME: str = get_optional_env("MONGODB_DB_NAME", "hireup")

# Authentication Settings
CLERK_SECRET_KEY: str = get_required_env("CLERK_SECRET_KEY")

# CORS and Allowed Origins (comma separated list)
FRONTEND_ORIGINS_RAW: str = get_optional_env("FRONTEND_ORIGINS", "http://localhost:3000")
raw_origins_list: list[str] = FRONTEND_ORIGINS_RAW.split(",")
FRONTEND_ORIGINS: list[str] = []
for origin in raw_origins_list:
    cleaned_origin: str = origin.strip().rstrip("/")
    if len(cleaned_origin) > 0:
        FRONTEND_ORIGINS.append(cleaned_origin)

# LiveKit Settings
LIVEKIT_URL: str = get_required_env("LIVEKIT_URL")
LIVEKIT_API_KEY: str = get_required_env("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET: str = get_required_env("LIVEKIT_API_SECRET")

# AI Services Settings
GROQ_API_KEY: str = get_required_env("GROQ_API_KEY")
DEEPGRAM_API_KEY: str = get_required_env("DEEPGRAM_API_KEY")
INTERVIEWER_LLM_MODEL: str = get_optional_env("INTERVIEWER_LLM_MODEL", "openai/gpt-oss-120b")
SCORING_LLM_MODEL: str = get_optional_env("SCORING_LLM_MODEL", "openai/gpt-oss-120b")
