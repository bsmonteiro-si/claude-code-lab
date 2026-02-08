def test_health_endpoint_returns_healthy_status(client):
    # Given
    expected_status_code = 200
    expected_body = {"status": "healthy"}

    # When
    response = client.get("/health")

    # Then
    assert response.status_code == expected_status_code
    assert response.json() == expected_body
