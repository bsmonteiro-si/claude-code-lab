def _create_template(client, name="Test Template", content="Hello {{name}}"):
    return client.post(
        "/api/templates/",
        json={"name": name, "description": "A test template", "content": content},
    )


def test_create_template(client):
    # When
    response = _create_template(client)

    # Then
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Test Template"
    assert body["latest_version"]["version_number"] == 1
    assert body["latest_version"]["content"] == "Hello {{name}}"


def test_list_templates(client):
    # Given
    _create_template(client, name="Template A")
    _create_template(client, name="Template B")

    # When
    response = client.get("/api/templates/")

    # Then
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert len(body["templates"]) == 2


def test_get_template(client):
    # Given
    create_response = _create_template(client)
    template_id = create_response.json()["id"]

    # When
    response = client.get(f"/api/templates/{template_id}")

    # Then
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Test Template"
    assert body["latest_version"]["version_number"] == 1


def test_update_template_creates_new_version(client):
    # Given
    create_response = _create_template(client)
    template_id = create_response.json()["id"]

    # When
    response = client.put(
        f"/api/templates/{template_id}",
        json={"content": "Updated content"},
    )

    # Then
    assert response.status_code == 200
    body = response.json()
    assert body["latest_version"]["version_number"] == 2
    assert body["latest_version"]["content"] == "Updated content"


def test_delete_template(client):
    # Given
    create_response = _create_template(client)
    template_id = create_response.json()["id"]

    # When
    delete_response = client.delete(f"/api/templates/{template_id}")

    # Then
    assert delete_response.status_code == 204
    get_response = client.get(f"/api/templates/{template_id}")
    assert get_response.status_code == 404


def test_get_template_versions(client):
    # Given
    create_response = _create_template(client)
    template_id = create_response.json()["id"]
    client.put(f"/api/templates/{template_id}", json={"content": "Version 2"})
    client.put(f"/api/templates/{template_id}", json={"content": "Version 3"})

    # When
    response = client.get(f"/api/templates/{template_id}/versions")

    # Then
    assert response.status_code == 200
    versions = response.json()
    assert len(versions) == 3
    assert versions[0]["version_number"] == 3
    assert versions[1]["version_number"] == 2
    assert versions[2]["version_number"] == 1
