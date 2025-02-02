"""WebSocket test helpers."""

import asyncio
import pytest
from typing import AsyncGenerator
from httpx import AsyncClient

class TestWebSocket:
    """Test WebSocket wrapper."""
    def __init__(self, url: str, client: AsyncClient):
        self.url = url
        self.client = client
        self.queue: asyncio.Queue = asyncio.Queue()

    async def __aenter__(self):
        """Enter async context."""
        self.ws = await self.client.websocket_connect(self.url)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Exit async context."""
        await self.ws.close()

    async def receive_json(self) -> dict:
        """Receive JSON message."""
        return await self.ws.receive_json()

    async def send_json(self, data: dict) -> None:
        """Send JSON message."""
        await self.ws.send_json(data)

@pytest.fixture
async def websocket_client(test_client):
    """Create WebSocket test client."""
    async with TestWebSocket("/ws", test_client) as ws:
        yield ws
