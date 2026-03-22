def test_register(client):
    resp = client.post("/auth/register", json={
        "store_name": "Test Store",
        "email": "test@example.com",
        "password": "secret123",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "test@example.com"
    assert data["store_name"] == "Test Store"
    assert data["rol"] == "admin"
    assert "id" in data
    assert "business_id" in data


def test_register_duplicate_email(client):
    client.post("/auth/register", json={
        "store_name": "Store 1",
        "email": "dup@example.com",
        "password": "secret123",
    })
    resp = client.post("/auth/register", json={
        "store_name": "Store 2",
        "email": "dup@example.com",
        "password": "secret123",
    })
    assert resp.status_code == 409


def test_login(client):
    client.post("/auth/register", json={
        "store_name": "Login Store",
        "email": "login@example.com",
        "password": "secret123",
    })
    resp = client.post("/auth/login", json={
        "email": "login@example.com",
        "password": "secret123",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client):
    client.post("/auth/register", json={
        "store_name": "Store",
        "email": "wrong@example.com",
        "password": "secret123",
    })
    resp = client.post("/auth/login", json={
        "email": "wrong@example.com",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401
