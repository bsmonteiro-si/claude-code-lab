def _register_user(client, email="test@example.com", display_name="Test User", password="securepass123"):
    return client.post(
        "/api/auth/register",
        json={"email": email, "display_name": display_name, "password": password},
    )


def _login_user(client, email="test@example.com", password="securepass123"):
    return client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )


def _auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def test_register_creates_user(client):
    # When
    response = _register_user(client)

    # Then
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "test@example.com"
    assert body["display_name"] == "Test User"
    assert "id" in body
    assert "created_at" in body
    assert "password" not in body
    assert "hashed_password" not in body


def test_register_rejects_duplicate_email(client):
    # Given
    _register_user(client)

    # When
    response = _register_user(client)

    # Then
    assert response.status_code == 409


def test_register_rejects_short_password(client):
    # When
    response = _register_user(client, password="short")

    # Then
    assert response.status_code == 422


def test_register_rejects_invalid_email(client):
    # When
    response = _register_user(client, email="not-an-email")

    # Then
    assert response.status_code == 422


def test_login_returns_token(client):
    # Given
    _register_user(client)

    # When
    response = _login_user(client)

    # Then
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    assert body["user"]["email"] == "test@example.com"


def test_login_rejects_wrong_password(client):
    # Given
    _register_user(client)

    # When
    response = _login_user(client, password="wrongpassword")

    # Then
    assert response.status_code == 401


def test_login_rejects_nonexistent_email(client):
    # When
    response = _login_user(client, email="nobody@example.com")

    # Then
    assert response.status_code == 401


def test_me_returns_current_user(client):
    # Given
    _register_user(client)
    token = _login_user(client).json()["access_token"]

    # When
    response = client.get("/api/auth/me", headers=_auth_header(token))

    # Then
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "test@example.com"
    assert body["display_name"] == "Test User"


def test_me_rejects_missing_token(client):
    # When
    response = client.get("/api/auth/me")

    # Then
    assert response.status_code == 403


def test_me_rejects_invalid_token(client):
    # When
    response = client.get("/api/auth/me", headers=_auth_header("invalid.token.here"))

    # Then
    assert response.status_code == 401


def test_protected_routes_reject_unauthenticated_access(client):
    # When
    response = client.get("/api/templates/")

    # Then
    assert response.status_code == 403
