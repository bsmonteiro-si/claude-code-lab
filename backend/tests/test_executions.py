from unittest.mock import MagicMock, patch


def _create_template(client, headers, name="Test Template", content="Hello {{name}}"):
    return client.post(
        "/api/templates/",
        json={"name": name, "description": "A test template", "content": content},
        headers=headers,
    )


@patch("app.services.execution_service.get_provider")
def test_execute_template(mock_get_provider, client, auth_headers):
    # Given
    mock_provider = MagicMock()
    mock_provider.execute.return_value = "Mock response"
    mock_get_provider.return_value = mock_provider

    template_response = _create_template(client, auth_headers)
    template_id = template_response.json()["id"]

    # When
    response = client.post(
        "/api/executions/",
        json={
            "template_id": template_id,
            "provider": "anthropic",
            "model": "claude-sonnet-4-5-20250929",
            "variables": {"name": "World"},
        },
        headers=auth_headers,
    )

    # Then
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "completed"
    assert body["output"] == "Mock response"
    assert body["template_name"] == "Test Template"


@patch("app.services.execution_service.get_provider")
def test_execute_missing_variable(mock_get_provider, client, auth_headers):
    # Given
    template_response = _create_template(client, auth_headers, content="Hello {{name}}")
    template_id = template_response.json()["id"]

    # When
    response = client.post(
        "/api/executions/",
        json={
            "template_id": template_id,
            "provider": "anthropic",
            "model": "claude-sonnet-4-5-20250929",
            "variables": {},
        },
        headers=auth_headers,
    )

    # Then
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "failed"
    assert "Missing variable: name" in body["error"]


@patch("app.services.execution_service.get_provider")
def test_list_executions(mock_get_provider, client, auth_headers):
    # Given
    mock_provider = MagicMock()
    mock_provider.execute.return_value = "Mock response"
    mock_get_provider.return_value = mock_provider

    template_response = _create_template(client, auth_headers)
    template_id = template_response.json()["id"]

    client.post(
        "/api/executions/",
        json={
            "template_id": template_id,
            "provider": "anthropic",
            "model": "claude-sonnet-4-5-20250929",
            "variables": {"name": "Alice"},
        },
        headers=auth_headers,
    )
    client.post(
        "/api/executions/",
        json={
            "template_id": template_id,
            "provider": "anthropic",
            "model": "claude-sonnet-4-5-20250929",
            "variables": {"name": "Bob"},
        },
        headers=auth_headers,
    )

    # When
    response = client.get("/api/executions/", headers=auth_headers)

    # Then
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert body["executions"][0]["template_name"] == "Test Template"


def test_execute_invalid_provider(client, auth_headers):
    # Given
    template_response = _create_template(client, auth_headers)
    template_id = template_response.json()["id"]

    # When
    response = client.post(
        "/api/executions/",
        json={
            "template_id": template_id,
            "provider": "invalid",
            "model": "some-model",
            "variables": {"name": "World"},
        },
        headers=auth_headers,
    )

    # Then
    assert response.status_code == 422
