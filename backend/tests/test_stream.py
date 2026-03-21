import threading
from datetime import datetime, timezone


def _setup(client, email="stream@example.com"):
    client.post("/auth/register", json={
        "store_name": "Stream Store",
        "email": email,
        "password": "secret123",
    })
    resp = client.post("/auth/login", json={"email": email, "password": "secret123"})
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/templates/", json={
        "name": "Stream Template",
        "fields": [{"name": "item", "type": "string", "required": True}],
    }, headers=headers)
    template_id = resp.json()["id"]
    return token, headers, template_id


def test_sse_receives_new_sale(client):
    token, headers, template_id = _setup(client, "sse1@example.com")

    received = []

    def listen():
        with client.stream("GET", f"/stream/sales?token={token}") as resp:
            for line in resp.iter_lines():
                if line.startswith("data:"):
                    received.append(line)
                    break

    listener = threading.Thread(target=listen)
    listener.start()

    import time
    time.sleep(0.3)

    client.post("/sales/", json={
        "template_id": template_id,
        "data": {"item": "Test Item"},
        "sold_at": datetime.now(timezone.utc).isoformat(),
    }, headers=headers)

    listener.join(timeout=5.0)
    assert len(received) == 1
    assert "Test Item" in received[0]


def test_sse_invalid_token(client):
    resp = client.get("/stream/sales?token=invalid")
    assert resp.status_code == 401
