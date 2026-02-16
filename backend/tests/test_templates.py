def _create_template(client, headers, name="Test Template", content="Hello {{name}}"):
    return client.post(
        "/api/templates/",
        json={"name": name, "description": "A test template", "content": content},
        headers=headers,
    )


def test_create_template(client, auth_headers):
    # When
    response = _create_template(client, auth_headers)

    # Then
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Test Template"
    assert body["latest_version"]["version_number"] == 1
    assert body["latest_version"]["content"] == "Hello {{name}}"


def test_list_templates(client, auth_headers):
    # Given
    _create_template(client, auth_headers, name="Template A")
    _create_template(client, auth_headers, name="Template B")

    # When
    response = client.get("/api/templates/", headers=auth_headers)

    # Then
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert len(body["templates"]) == 2


def test_get_template(client, auth_headers):
    # Given
    create_response = _create_template(client, auth_headers)
    template_id = create_response.json()["id"]

    # When
    response = client.get(f"/api/templates/{template_id}", headers=auth_headers)

    # Then
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Test Template"
    assert body["latest_version"]["version_number"] == 1


def test_update_template_creates_new_version(client, auth_headers):
    # Given
    create_response = _create_template(client, auth_headers)
    template_id = create_response.json()["id"]

    # When
    response = client.put(
        f"/api/templates/{template_id}",
        json={"content": "Updated content"},
        headers=auth_headers,
    )

    # Then
    assert response.status_code == 200
    body = response.json()
    assert body["latest_version"]["version_number"] == 2
    assert body["latest_version"]["content"] == "Updated content"


def test_delete_template(client, auth_headers):
    # Given
    create_response = _create_template(client, auth_headers)
    template_id = create_response.json()["id"]

    # When
    delete_response = client.delete(f"/api/templates/{template_id}", headers=auth_headers)

    # Then
    assert delete_response.status_code == 204
    get_response = client.get(f"/api/templates/{template_id}", headers=auth_headers)
    assert get_response.status_code == 404


def test_get_template_versions(client, auth_headers):
    # Given
    create_response = _create_template(client, auth_headers)
    template_id = create_response.json()["id"]
    client.put(f"/api/templates/{template_id}", json={"content": "Version 2"}, headers=auth_headers)
    client.put(f"/api/templates/{template_id}", json={"content": "Version 3"}, headers=auth_headers)

    # When
    response = client.get(f"/api/templates/{template_id}/versions", headers=auth_headers)

    # Then
    assert response.status_code == 200
    versions = response.json()
    assert len(versions) == 3
    assert versions[0]["version_number"] == 3
    assert versions[1]["version_number"] == 2
    assert versions[2]["version_number"] == 1


def test_unauthenticated_request_is_rejected(client):
    # When
    response = client.get("/api/templates/")

    # Then
    assert response.status_code == 403


def test_user_cannot_access_other_users_templates(client, auth_headers):
    # Given — user A creates a template
    create_response = _create_template(client, auth_headers)
    template_id = create_response.json()["id"]

    # Given — user B registers and logs in
    client.post(
        "/api/auth/register",
        json={"email": "userb@example.com", "display_name": "User B", "password": "securepass123"},
    )
    login_response = client.post(
        "/api/auth/login",
        json={"email": "userb@example.com", "password": "securepass123"},
    )
    user_b_headers = {"Authorization": f"Bearer {login_response.json()['access_token']}"}

    # When — user B tries to access user A's template
    response = client.get(f"/api/templates/{template_id}", headers=user_b_headers)

    # Then
    assert response.status_code == 404

    # When — user B lists templates
    list_response = client.get("/api/templates/", headers=user_b_headers)

    # Then — user B sees zero templates
    assert list_response.json()["total"] == 0
