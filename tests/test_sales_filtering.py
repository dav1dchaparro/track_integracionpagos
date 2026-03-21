from datetime import datetime, timezone


async def _setup(client, email="filter@example.com"):
    await client.post("/auth/register", json={
        "store_name": "Filter Store",
        "email": email,
        "password": "secret123",
    })
    resp = await client.post("/auth/login", json={"email": email, "password": "secret123"})
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post("/templates/", json={
        "name": "Products",
        "fields": [
            {"name": "product", "type": "string", "required": True},
            {"name": "quantity", "type": "integer", "required": True},
            {"name": "price", "type": "float", "required": True},
            {"name": "category", "type": "string", "required": False},
        ],
    }, headers=headers)
    template_id = resp.json()["id"]

    # Insert test data
    sales_data = [
        {"product": "Coffee", "quantity": 2, "price": 4.5, "category": "drinks"},
        {"product": "Tea", "quantity": 1, "price": 3.0, "category": "drinks"},
        {"product": "Sandwich", "quantity": 3, "price": 7.0, "category": "food"},
        {"product": "Coffee", "quantity": 5, "price": 4.5, "category": "drinks"},
    ]
    for d in sales_data:
        await client.post("/sales/", json={
            "template_id": template_id,
            "data": d,
            "sold_at": datetime.now(timezone.utc).isoformat(),
        }, headers=headers)

    return headers, template_id


async def test_filter_by_product(client):
    headers, _ = await _setup(client, "filt1@example.com")
    resp = await client.get("/sales/?filter_product=Coffee", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert all(s["data"]["product"] == "Coffee" for s in data)


async def test_filter_by_category(client):
    headers, _ = await _setup(client, "filt2@example.com")
    resp = await client.get("/sales/?filter_category=drinks", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 3


async def test_filter_by_multiple_fields(client):
    headers, _ = await _setup(client, "filt3@example.com")
    resp = await client.get("/sales/?filter_product=Coffee&filter_quantity=5", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1


async def test_filter_no_match(client):
    headers, _ = await _setup(client, "filt4@example.com")
    resp = await client.get("/sales/?filter_product=Pizza", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 0
