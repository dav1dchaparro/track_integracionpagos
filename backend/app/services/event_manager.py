import asyncio
import json
from collections import defaultdict


class EventManager:
    def __init__(self):
        self._queues: dict[str, list[asyncio.Queue]] = defaultdict(list)

    async def subscribe(self, user_id: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        self._queues[user_id].append(queue)
        return queue

    def unsubscribe(self, user_id: str, queue: asyncio.Queue):
        self._queues[user_id].remove(queue)
        if not self._queues[user_id]:
            del self._queues[user_id]

    async def broadcast(self, user_id: str, data: dict):
        message = json.dumps(data)
        for queue in self._queues.get(user_id, []):
            await queue.put(message)


event_manager = EventManager()
