def _login(client, email="cat@example.com"):
    client.post("/auth/register", json={
        "store_name": "Cat Store", "email": email, "password": "secret123",
    })
    resp = client.post("/auth/login", json={"email": email, "password": "secret123"})
    return resp.json()["access_token"]


def test_create_category(client):
    token = _login(client, "cat1@example.com")
    resp = client.post("/categories/", json={"name": "Drinks"},
                       headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    assert resp.json()["name"] == "Drinks"


def test_list_categories(client):
    token = _login(client, "cat2@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    client.post("/categories/", json={"name": "Food"}, headers=headers)
    client.post("/categories/", json={"name": "Drinks"}, headers=headers)
    resp = client.get("/categories/", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2
