"""Request-level upload body guard, applied before multipart parsing."""
from __future__ import annotations

from typing import Any


class _RequestBodyTooLarge(BaseException):
    """Internal control flow used to abort a streamed oversized request."""


class UploadSizeLimitMiddleware:
    """Limit upload request bytes before FastAPI can spool multipart data."""

    def __init__(self, app: Any, *, max_bytes: int, overhead_bytes: int = 1024 * 1024) -> None:
        self.app = app
        self.max_request_bytes = max_bytes + overhead_bytes

    async def __call__(self, scope: dict[str, Any], receive: Any, send: Any) -> None:
        upload_paths = {"/api/analyze", "/api/analyze/upload"}
        if not (
            scope.get("type") == "http"
            and scope.get("method") == "POST"
            and scope.get("path") in upload_paths
        ):
            await self.app(scope, receive, send)
            return

        headers = {key.lower(): value for key, value in scope.get("headers", [])}
        content_length = headers.get(b"content-length")
        if content_length is not None:
            try:
                declared_size = int(content_length)
            except ValueError:
                await self._respond_too_large(send)
                return
            if declared_size < 0 or declared_size > self.max_request_bytes:
                await self._respond_too_large(send)
                return

        received_bytes = 0

        async def limited_receive() -> dict[str, Any]:
            nonlocal received_bytes
            message = await receive()
            if message.get("type") == "http.request":
                received_bytes += len(message.get("body", b""))
                if received_bytes > self.max_request_bytes:
                    raise _RequestBodyTooLarge
            return message

        try:
            await self.app(scope, limited_receive, send)
        except _RequestBodyTooLarge:
            await self._respond_too_large(send)

    @staticmethod
    async def _respond_too_large(send: Any) -> None:
        body = b'{"detail":"Upload request exceeds the configured size limit."}'
        await send(
            {
                "type": "http.response.start",
                "status": 413,
                "headers": [
                    (b"content-type", b"application/json"),
                    (b"content-length", str(len(body)).encode("ascii")),
                ],
            }
        )
        await send({"type": "http.response.body", "body": body})
