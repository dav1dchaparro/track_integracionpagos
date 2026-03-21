import asyncio
from datetime import datetime, timezone


async def _setup(client, email="stream@example.com"):
    await client.post("/auth/register", json={
        "store_name": "Stream Store",
        "email": email,
        "password": "secret123",
    })
    resp = await client.post("/auth/login", json={"email": email, "password": "secret123"})
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post("/templates/", json={
        "name": "Stream Template",
        "fields": [{"name": "item", "type": "string", "required": True}],
    }, headers=headers)
    template_id = resp.json()["id"]
    return token, headers, template_id


async def test_sse_receives_new_sale(client):
    token, headers, template_id = await _setup(client, "sse1@example.com")

    received = []

    async def listen():
        async with client.stream("GET", f"/stream/sales?token={token}") as resp:
            async for line in resp.aiter_lines():
                if line.startswith("data:"):
                    received.append(line)
                    break

    listener = asyncio.create_task(listen())
    await asyncio.sleep(0.2)

    await client.post("/sales/", json={
        "template_id": template_id,
        "data": {"item": "Test Item"},
        "sold_at": datetime.now(timezone.utc).isoformat(),
    }, headers=headers)

    await asyncio.wait_for(listener, timeout=5.0)
    assert len(received) == 1
    assert "Test Item" in received[0]


async def test_sse_invalid_token(client):
    resp = await client.get("/stream/sales?token=invalid")
    assert resp.status_code == 401
