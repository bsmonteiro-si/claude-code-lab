from unittest.mock import MagicMock, patch


def _create_template(client, headers, name="Test Template", content="Hello {{name}}"):
    return client.post(
        "/api/templates/",
        json={"name": name, "description": "A test template", "content": content},
        headers=headers,
    )


def _create_pipeline(client, headers, template_ids, steps=None):
    if steps is None:
        steps = [
            {
                "template_id": template_ids[i],
                "provider": "openai",
                "model": "gpt-4o-mini",
                "output_variable": f"step_{i + 1}_output",
            }
            for i in range(len(template_ids))
        ]

    return client.post(
        "/api/pipelines/",
        json={
            "name": "Test Pipeline",
            "description": "A test pipeline",
            "steps": steps,
        },
        headers=headers,
    )


def test_create_pipeline(client, auth_headers):
    # Given
    t1 = _create_template(client, auth_headers, name="Step 1", content="Translate: {{text}}")
    t2 = _create_template(client, auth_headers, name="Step 2", content="Summarize: {{step_1_output}}")
    t1_id = t1.json()["id"]
    t2_id = t2.json()["id"]

    # When
    response = _create_pipeline(client, auth_headers, [t1_id, t2_id])

    # Then
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Test Pipeline"
    assert len(body["steps"]) == 2
    assert body["steps"][0]["step_order"] == 1
    assert body["steps"][0]["template_name"] == "Step 1"
    assert body["steps"][1]["step_order"] == 2
    assert body["steps"][1]["template_name"] == "Step 2"


def test_list_pipelines(client, auth_headers):
    # Given
    t1 = _create_template(client, auth_headers, name="Template A", content="{{input}}")
    t1_id = t1.json()["id"]
    _create_pipeline(client, auth_headers, [t1_id])

    t2 = _create_template(client, auth_headers, name="Template B", content="{{input}}")
    t2_id = t2.json()["id"]
    client.post(
        "/api/pipelines/",
        json={
            "name": "Pipeline 2",
            "description": None,
            "steps": [
                {"template_id": t2_id, "provider": "anthropic", "model": "claude-sonnet-4-5-20250929", "output_variable": "out"},
            ],
        },
        headers=auth_headers,
    )

    # When
    response = client.get("/api/pipelines/", headers=auth_headers)

    # Then
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2


@patch("app.engine.pipeline_executor.get_provider")
def test_execute_pipeline(mock_get_provider, client, auth_headers):
    # Given
    mock_provider = MagicMock()
    mock_provider.execute.side_effect = ["Translated text", "Summary of translated text"]
    mock_get_provider.return_value = mock_provider

    t1 = _create_template(client, auth_headers, name="Translate", content="Translate: {{text}}")
    t2 = _create_template(client, auth_headers, name="Summarize", content="Summarize: {{english_text}}")
    t1_id = t1.json()["id"]
    t2_id = t2.json()["id"]

    steps = [
        {"template_id": t1_id, "provider": "openai", "model": "gpt-4o-mini", "output_variable": "english_text"},
        {"template_id": t2_id, "provider": "openai", "model": "gpt-4o-mini", "output_variable": "summary"},
    ]
    pipeline = _create_pipeline(client, auth_headers, [t1_id, t2_id], steps=steps)
    pipeline_id = pipeline.json()["id"]

    # When
    response = client.post(
        f"/api/pipelines/{pipeline_id}/execute",
        json={"variables": {"text": "Bonjour le monde"}},
        headers=auth_headers,
    )

    # Then
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "completed"
    assert body["pipeline_name"] == "Test Pipeline"
    assert len(body["step_executions"]) == 2
    assert body["step_executions"][0]["status"] == "completed"
    assert body["step_executions"][0]["output"] == "Translated text"
    assert body["step_executions"][1]["status"] == "completed"
    assert body["step_executions"][1]["output"] == "Summary of translated text"


@patch("app.engine.pipeline_executor.get_provider")
def test_execute_pipeline_step_failure(mock_get_provider, client, auth_headers):
    # Given
    mock_provider = MagicMock()
    mock_provider.execute.side_effect = ["Step 1 output", Exception("LLM error on step 2")]
    mock_get_provider.return_value = mock_provider

    t1 = _create_template(client, auth_headers, name="Step 1", content="{{input}}")
    t2 = _create_template(client, auth_headers, name="Step 2", content="{{step_1_out}}")
    t1_id = t1.json()["id"]
    t2_id = t2.json()["id"]

    steps = [
        {"template_id": t1_id, "provider": "openai", "model": "gpt-4o-mini", "output_variable": "step_1_out"},
        {"template_id": t2_id, "provider": "openai", "model": "gpt-4o-mini", "output_variable": "step_2_out"},
    ]
    pipeline = _create_pipeline(client, auth_headers, [t1_id, t2_id], steps=steps)
    pipeline_id = pipeline.json()["id"]

    # When
    response = client.post(
        f"/api/pipelines/{pipeline_id}/execute",
        json={"variables": {"input": "hello"}},
        headers=auth_headers,
    )

    # Then
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "failed"
    assert body["step_executions"][0]["status"] == "completed"
    assert body["step_executions"][1]["status"] == "failed"
    assert "LLM error on step 2" in body["step_executions"][1]["error"]


@patch("app.engine.pipeline_executor.get_provider")
def test_list_all_pipeline_executions(mock_get_provider, client, auth_headers):
    # Given
    mock_provider = MagicMock()
    mock_provider.execute.return_value = "output"
    mock_get_provider.return_value = mock_provider

    t1 = _create_template(client, auth_headers, name="T1", content="{{x}}")
    t1_id = t1.json()["id"]
    pipeline = _create_pipeline(client, auth_headers, [t1_id])
    pipeline_id = pipeline.json()["id"]

    client.post(
        f"/api/pipelines/{pipeline_id}/execute",
        json={"variables": {"x": "hello"}},
        headers=auth_headers,
    )

    # When
    response = client.get("/api/pipeline-executions/", headers=auth_headers)

    # Then
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["executions"][0]["pipeline_name"] == "Test Pipeline"


def test_delete_pipeline(client, auth_headers):
    # Given
    t1 = _create_template(client, auth_headers, name="Template", content="{{x}}")
    t1_id = t1.json()["id"]
    pipeline = _create_pipeline(client, auth_headers, [t1_id])
    pipeline_id = pipeline.json()["id"]

    # When
    delete_response = client.delete(f"/api/pipelines/{pipeline_id}", headers=auth_headers)

    # Then
    assert delete_response.status_code == 204
    get_response = client.get(f"/api/pipelines/{pipeline_id}", headers=auth_headers)
    assert get_response.status_code == 404
