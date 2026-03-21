import asyncio
import json

import pytest


class TestEventManager:
    """Unit tests for EventManager — no DB needed."""

    def _make_manager(self):
        from app.services.event_manager import EventManager
        return EventManager()

    def test_subscribe_and_broadcast(self):
        manager = self._make_manager()
        loop = asyncio.new_event_loop()
        try:
            queue = loop.run_until_complete(manager.subscribe("user-1"))
            loop.run_until_complete(manager.broadcast("user-1", {"item": "Coffee", "total": 9.00}))
            message = loop.run_until_complete(asyncio.wait_for(queue.get(), timeout=1.0))
            result = json.loads(message)
            assert result["item"] == "Coffee"
            assert result["total"] == 9.00
        finally:
            loop.close()

    def test_unsubscribe(self):
        manager = self._make_manager()
        loop = asyncio.new_event_loop()
        try:
            queue = loop.run_until_complete(manager.subscribe("user-2"))
            manager.unsubscribe("user-2", queue)
            loop.run_until_complete(manager.broadcast("user-2", {"item": "Ghost"}))
            assert queue.empty() is True
        finally:
            loop.close()

    def test_multiple_subscribers(self):
        manager = self._make_manager()
        loop = asyncio.new_event_loop()
        try:
            q1 = loop.run_until_complete(manager.subscribe("user-3"))
            q2 = loop.run_until_complete(manager.subscribe("user-3"))
            loop.run_until_complete(manager.broadcast("user-3", {"item": "Tea"}))
            m1 = json.loads(loop.run_until_complete(q1.get()))
            m2 = json.loads(loop.run_until_complete(q2.get()))
            assert m1["item"] == "Tea"
            assert m2["item"] == "Tea"
        finally:
            loop.close()

    def test_no_crosstalk(self):
        manager = self._make_manager()
        loop = asyncio.new_event_loop()
        try:
            q1 = loop.run_until_complete(manager.subscribe("user-a"))
            q2 = loop.run_until_complete(manager.subscribe("user-b"))
            loop.run_until_complete(manager.broadcast("user-a", {"item": "Only for A"}))
            assert q1.empty() is False
            assert q2.empty() is True
        finally:
            loop.close()


def test_sse_invalid_token(client):
    resp = client.get("/stream/sales?token=invalid")
    assert resp.status_code == 401
