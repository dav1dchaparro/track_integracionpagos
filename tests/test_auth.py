

async def test_register(client):
    resp = await client.post("/auth/register", json={
        "store_name": "Test Store",
        "email": "test@example.com",
        "password": "secret123",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "test@example.com"
    assert data["store_name"] == "Test Store"
    assert "id" in data


async def test_register_duplicate_email(client):
    await client.post("/auth/register", json={
        "store_name": "Store 1",
        "email": "dup@example.com",
        "password": "secret123",
    })
    resp = await client.post("/auth/register", json={
        "store_name": "Store 2",
        "email": "dup@example.com",
        "password": "secret123",
    })
    assert resp.status_code == 409


async def test_login(client):
    await client.post("/auth/register", json={
        "store_name": "Login Store",
        "email": "login@example.com",
        "password": "secret123",
    })
    resp = await client.post("/auth/login", json={
        "email": "login@example.com",
        "password": "secret123",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


async def test_login_wrong_password(client):
    await client.post("/auth/register", json={
        "store_name": "Store",
        "email": "wrong@example.com",
        "password": "secret123",
    })
    resp = await client.post("/auth/login", json={
        "email": "wrong@example.com",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401
