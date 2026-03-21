from datetime import datetime, timezone


def _setup(client, email="sales@example.com"):
    client.post("/auth/register", json={
        "store_name": "Sales Store", "email": email, "password": "secret123",
    })
    resp = client.post("/auth/login", json={"email": email, "password": "secret123"})
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/categories/", json={"name": "Drinks"}, headers=headers)
    cat_id = resp.json()["id"]

    resp = client.post("/products/", json={
        "name": "Coffee", "price": 4.50, "category_ids": [cat_id],
    }, headers=headers)
    product_id = resp.json()["id"]

    return headers, product_id


def test_create_sale_card(client):
    headers, product_id = _setup(client, "sale1@example.com")
    resp = client.post("/sales/", json={
        "invoice_number": "F-001",
        "payment_method": "card",
        "card_type": "credit",
        "card_brand": "visa",
        "card_category": "platinum",
        "items": [{"product_id": product_id, "quantity": 2}],
        "sold_at": datetime.now(timezone.utc).isoformat(),
    }, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["invoice_number"] == "F-001"
    assert data["payment_method"] == "card"
    assert data["card_brand"] == "visa"
    assert data["total"] == 9.00
    assert len(data["items"]) == 1
    assert data["items"][0]["subtotal"] == 9.00
    assert data["items"][0]["quantity"] == 2


def test_create_sale_qr(client):
    headers, product_id = _setup(client, "sale2@example.com")
    resp = client.post("/sales/", json={
        "invoice_number": "F-002",
        "payment_method": "qr",
        "items": [{"product_id": product_id, "quantity": 1}],
        "sold_at": datetime.now(timezone.utc).isoformat(),
    }, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["payment_method"] == "qr"
    assert data["card_type"] is None
    assert data["card_brand"] is None
    assert data["total"] == 4.50


def test_create_sale_card_missing_brand(client):
    headers, product_id = _setup(client, "sale3@example.com")
    resp = client.post("/sales/", json={
        "invoice_number": "F-003",
        "payment_method": "card",
        "items": [{"product_id": product_id, "quantity": 1}],
        "sold_at": datetime.now(timezone.utc).isoformat(),
    }, headers=headers)
    assert resp.status_code == 422


def test_create_sale_no_items(client):
    headers, _ = _setup(client, "sale4@example.com")
    resp = client.post("/sales/", json={
        "invoice_number": "F-004",
        "payment_method": "qr",
        "items": [],
        "sold_at": datetime.now(timezone.utc).isoformat(),
    }, headers=headers)
    assert resp.status_code == 422


def test_create_sale_multiple_items(client):
    headers, product_id1 = _setup(client, "sale5@example.com")
    resp = client.post("/categories/", json={"name": "Food"}, headers=headers)
    cat_id = resp.json()["id"]
    resp = client.post("/products/", json={
        "name": "Sandwich", "price": 7.00, "category_ids": [cat_id],
    }, headers=headers)
    product_id2 = resp.json()["id"]

    resp = client.post("/sales/", json={
        "invoice_number": "F-005",
        "payment_method": "qr",
        "items": [
            {"product_id": product_id1, "quantity": 2},
            {"product_id": product_id2, "quantity": 1},
        ],
        "sold_at": datetime.now(timezone.utc).isoformat(),
    }, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["total"] == 16.00
    assert len(data["items"]) == 2


def test_list_sales(client):
    headers, product_id = _setup(client, "sale6@example.com")
    for i in range(3):
        client.post("/sales/", json={
            "invoice_number": f"F-{i}",
            "payment_method": "qr",
            "items": [{"product_id": product_id, "quantity": 1}],
            "sold_at": datetime.now(timezone.utc).isoformat(),
        }, headers=headers)
    resp = client.get("/sales/", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 3


def test_list_sales_filter_by_payment_method(client):
    headers, product_id = _setup(client, "sale7@example.com")
    client.post("/sales/", json={
        "invoice_number": "F-QR",
        "payment_method": "qr",
        "items": [{"product_id": product_id, "quantity": 1}],
        "sold_at": datetime.now(timezone.utc).isoformat(),
    }, headers=headers)
    client.post("/sales/", json={
        "invoice_number": "F-CARD",
        "payment_method": "card",
        "card_type": "debit",
        "card_brand": "mastercard",
        "items": [{"product_id": product_id, "quantity": 1}],
        "sold_at": datetime.now(timezone.utc).isoformat(),
    }, headers=headers)
    resp = client.get("/sales/?payment_method=qr", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["payment_method"] == "qr"
