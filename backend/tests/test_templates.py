def _register_and_login(client, email="tmpl@example.com"):
    client.post("/auth/register", json={
        "store_name": "Template Store",
        "email": email,
        "password": "secret123",
    })
    resp = client.post("/auth/login", json={"email": email, "password": "secret123"})
    return resp.json()["access_token"]


def test_create_template(client):
    token = _register_and_login(client, "tmpl1@example.com")
    resp = client.post("/templates/", json={
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


def test_list_templates(client):
    token = _register_and_login(client, "tmpl2@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    client.post("/templates/", json={
        "name": "T1",
        "fields": [{"name": "x", "type": "string", "required": True}],
    }, headers=headers)
    client.post("/templates/", json={
        "name": "T2",
        "fields": [{"name": "y", "type": "integer", "required": False}],
    }, headers=headers)
    resp = client.get("/templates/", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_create_template_unauthorized(client):
    resp = client.post("/templates/", json={
        "name": "Nope",
        "fields": [],
    })
    assert resp.status_code == 403
