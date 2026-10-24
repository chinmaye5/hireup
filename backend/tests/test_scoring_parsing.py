"""
Unit tests for scoring parsing and validation functions.
"""

import pytest
from pydantic import ValidationError
from services.scoring_service import parse_and_validate_evaluation


def test_parse_valid_json():
    """Checks that a clean JSON string matching the schema parses correctly."""
    valid_json = """
    {
        "overall_score": 8.5,
        "per_question": [
            {
                "question_index": 1,
                "score": 8.0,
                "notes": "Good overview of tech stack"
            },
            {
                "question_index": 2,
                "score": 9.0,
                "notes": "Accurately described non-blocking event loops"
            }
        ],
        "summary": "Strong candidate with solid foundations.",
        "strengths": ["Clear communication", "Async I/O expertise"],
        "weaknesses": ["Could share more debugging metrics"],
        "recommendation": "yes"
    }
    """
    result = parse_and_validate_evaluation(valid_json)
    assert result.overall_score == 8.5
    assert len(result.per_question) == 2
    assert result.recommendation == "yes"


def test_parse_code_fenced_json():
    """Checks that markdown code fences (```json ... ```) are stripped."""
    fenced_json = """```json
    {
        "overall_score": 7.0,
        "per_question": [
            {
                "question_index": 1,
                "score": 7.0,
                "notes": "Answered clearly"
            }
        ],
        "summary": "Adequate performance.",
        "strengths": ["Honesty"],
        "weaknesses": ["Limited depth"],
        "recommendation": "maybe"
    }
    ```"""
    result = parse_and_validate_evaluation(fenced_json)
    assert result.overall_score == 7.0
    assert result.recommendation == "maybe"


def test_parse_invalid_json_syntax():
    """Checks that malformed JSON raises ValueError."""
    bad_syntax = "{ this is not json }"
    with pytest.raises(ValueError):
        parse_and_validate_evaluation(bad_syntax)


def test_parse_invalid_schema_missing_fields():
    """Checks that missing mandatory fields raise ValidationError."""
    missing_fields = """
    {
        "overall_score": 5.0
    }
    """
    with pytest.raises(ValidationError):
        parse_and_validate_evaluation(missing_fields)


def test_parse_invalid_score_range():
    """Checks that scores outside 0-10 raise ValidationError."""
    out_of_bounds = """
    {
        "overall_score": 15.0,
        "per_question": [],
        "summary": "Invalid score",
        "strengths": [],
        "weaknesses": [],
        "recommendation": "no"
    }
    """
    with pytest.raises(ValidationError):
        parse_and_validate_evaluation(out_of_bounds)
