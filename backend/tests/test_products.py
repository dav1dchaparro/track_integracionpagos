def _setup(client, email="prod@example.com"):
    client.post("/auth/register", json={
        "store_name": "Prod Store", "email": email, "password": "secret123",
    })
    resp = client.post("/auth/login", json={"email": email, "password": "secret123"})
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/categories/", json={"name": "Drinks"}, headers=headers)
    cat_id = resp.json()["id"]
    return headers, cat_id


def test_create_product(client):
    headers, cat_id = _setup(client, "prod1@example.com")
    resp = client.post("/products/", json={
        "name": "Coffee", "price": 4.50, "category_ids": [cat_id],
    }, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Coffee"
    assert data["price"] == 4.50
    assert len(data["categories"]) == 1


def test_create_product_multiple_categories(client):
    headers, cat_id1 = _setup(client, "prod2@example.com")
    resp = client.post("/categories/", json={"name": "Hot"}, headers=headers)
    cat_id2 = resp.json()["id"]
    resp = client.post("/products/", json={
        "name": "Latte", "price": 5.00, "category_ids": [cat_id1, cat_id2],
    }, headers=headers)
    assert resp.status_code == 201
    assert len(resp.json()["categories"]) == 2


def test_create_product_invalid_category(client):
    headers, _ = _setup(client, "prod3@example.com")
    resp = client.post("/products/", json={
        "name": "Ghost", "price": 1.00,
        "category_ids": ["00000000-0000-0000-0000-000000000000"],
    }, headers=headers)
    assert resp.status_code == 404


def test_list_products(client):
    headers, cat_id = _setup(client, "prod4@example.com")
    client.post("/products/", json={
        "name": "Tea", "price": 3.00, "category_ids": [cat_id],
    }, headers=headers)
    client.post("/products/", json={
        "name": "Juice", "price": 5.00, "category_ids": [cat_id],
    }, headers=headers)
    resp = client.get("/products/", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2
