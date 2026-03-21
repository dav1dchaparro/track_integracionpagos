

async def _register_and_login(client, email="tmpl@example.com"):
    await client.post("/auth/register", json={
        "store_name": "Template Store",
        "email": email,
        "password": "secret123",
    })
    resp = await client.post("/auth/login", json={"email": email, "password": "secret123"})
    return resp.json()["access_token"]


async def test_create_template(client):
    token = await _register_and_login(client, "tmpl1@example.com")
    resp = await client.post("/templates/", json={
        "name": "Coffee Sale",
        "fields": [
            {"name": "product", "type": "string", "required": True},
            {"name": "quantity", "type": "integer", "required": True},
            {"name": "price", "type": "float", "required": True},
        ],
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Coffee Sale"
    assert len(data["fields"]) == 3


async def test_list_templates(client):
    token = await _register_and_login(client, "tmpl2@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    await client.post("/templates/", json={
        "name": "T1",
        "fields": [{"name": "x", "type": "string", "required": True}],
    }, headers=headers)
    await client.post("/templates/", json={
        "name": "T2",
        "fields": [{"name": "y", "type": "integer", "required": False}],
    }, headers=headers)
    resp = await client.get("/templates/", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


async def test_create_template_unauthorized(client):
    resp = await client.post("/templates/", json={
        "name": "Nope",
        "fields": [],
    })
    assert resp.status_code == 403
