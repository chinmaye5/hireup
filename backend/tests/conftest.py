"""
Pytest configuration fixture for the backend test suite.

What this file is for:
Provides mock environment variables during test collection and execution
so unit tests for pure functions can run without requiring a real .env file.
"""

import os
import pytest

# Inject test environment variables before module imports occur
os.environ["MONGODB_URI"] = "mongodb://localhost:27017/hireup_test"
os.environ["MONGODB_DB_NAME"] = "hireup_test"
os.environ["CLERK_SECRET_KEY"] = "sk_test_mock_for_tests"
os.environ["FRONTEND_ORIGINS"] = "http://localhost:3000"
os.environ["LIVEKIT_URL"] = "wss://test.livekit.cloud"
os.environ["LIVEKIT_API_KEY"] = "API_mock"
os.environ["LIVEKIT_API_SECRET"] = "secret_mock"
os.environ["GROQ_API_KEY"] = "gsk_mock"
os.environ["DEEPGRAM_API_KEY"] = "mock_deepgram"
os.environ["INTERVIEWER_LLM_MODEL"] = "openai/gpt-oss-120b"
os.environ["SCORING_LLM_MODEL"] = "openai/gpt-oss-120b"
