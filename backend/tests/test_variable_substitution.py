import pytest

from app.engine.variable_substitution import extract_variables, substitute_variables


def test_substitute_variables():
    # Given
    content = "Hello {{name}}, welcome to {{place}}!"
    variables = {"name": "Alice", "place": "Wonderland"}

    # When
    result = substitute_variables(content, variables)

    # Then
    assert result == "Hello Alice, welcome to Wonderland!"


def test_substitute_raises_on_missing_variable():
    # Given
    content = "Hello {{name}}, welcome to {{place}}!"
    variables = {"name": "Alice"}

    # When / Then
    with pytest.raises(ValueError, match="Missing variable: place"):
        substitute_variables(content, variables)


def test_extract_variables():
    # Given
    content = "Hi {{name}}, you are from {{city}} in {{country}}."

    # When
    result = extract_variables(content)

    # Then
    assert set(result) == {"name", "city", "country"}


def test_substitute_no_variables():
    # Given
    content = "Plain text without any variables."
    variables = {}

    # When
    result = substitute_variables(content, variables)

    # Then
    assert result == "Plain text without any variables."
