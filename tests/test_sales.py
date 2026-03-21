from datetime import datetime, timezone


async def _setup(client, email="sales@example.com"):
    await client.post("/auth/register", json={
        "store_name": "Sales Store",
        "email": email,
        "password": "secret123",
    })
    resp = await client.post("/auth/login", json={"email": email, "password": "secret123"})
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post("/templates/", json={
        "name": "Product Sale",
        "fields": [
            {"name": "product", "type": "string", "required": True},
            {"name": "quantity", "type": "integer", "required": True},
            {"name": "price", "type": "float", "required": True},
            {"name": "notes", "type": "string", "required": False},
        ],
    }, headers=headers)
    template_id = resp.json()["id"]
    return headers, template_id


async def test_create_sale(client):
    headers, template_id = await _setup(client, "sale1@example.com")
    resp = await client.post("/sales/", json={
        "template_id": template_id,
        "data": {"product": "Coffee", "quantity": 2, "price": 4.50},
        "sold_at": datetime.now(timezone.utc).isoformat(),
    }, headers=headers)
    assert resp.status_code == 201
    assert resp.json()["data"]["product"] == "Coffee"


async def test_create_sale_missing_required(client):
    headers, template_id = await _setup(client, "sale2@example.com")
    resp = await client.post("/sales/", json={
        "template_id": template_id,
        "data": {"product": "Coffee"},
        "sold_at": datetime.now(timezone.utc).isoformat(),
    }, headers=headers)
    assert resp.status_code == 422


async def test_create_sale_wrong_type(client):
    headers, template_id = await _setup(client, "sale3@example.com")
    resp = await client.post("/sales/", json={
        "template_id": template_id,
        "data": {"product": "Coffee", "quantity": "not_a_number", "price": 4.50},
        "sold_at": datetime.now(timezone.utc).isoformat(),
    }, headers=headers)
    assert resp.status_code == 422


async def test_create_sale_extra_field(client):
    headers, template_id = await _setup(client, "sale4@example.com")
    resp = await client.post("/sales/", json={
        "template_id": template_id,
        "data": {"product": "Coffee", "quantity": 1, "price": 3.0, "unknown": "x"},
        "sold_at": datetime.now(timezone.utc).isoformat(),
    }, headers=headers)
    assert resp.status_code == 422


async def test_list_sales(client):
    headers, template_id = await _setup(client, "sale5@example.com")
    for i in range(3):
        await client.post("/sales/", json={
            "template_id": template_id,
            "data": {"product": f"Item {i}", "quantity": 1, "price": 1.0},
            "sold_at": datetime.now(timezone.utc).isoformat(),
        }, headers=headers)
    resp = await client.get("/sales/", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 3
