"""Thin async wrapper around the sync Convex client. Every call passes WORKER_SECRET."""

import asyncio
import os
from typing import Any

import httpx
from convex import ConvexClient


class ConvexApi:
    def __init__(self) -> None:
        self._client = ConvexClient(os.environ["CONVEX_URL"])
        self._secret = os.environ["WORKER_SECRET"]
        self._http = httpx.AsyncClient(timeout=30)

    async def mutation(self, name: str, **args: Any) -> Any:
        return await asyncio.to_thread(self._client.mutation, f"worker:{name}", {"secret": self._secret, **args})

    async def upload(self, data: bytes, content_type: str = "image/jpeg") -> str:
        url = await self.mutation("generateUploadUrl")
        res = await self._http.post(url, content=data, headers={"Content-Type": content_type})
        res.raise_for_status()
        return res.json()["storageId"]
