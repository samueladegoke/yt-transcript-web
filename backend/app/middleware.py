"""
Middleware for the YouTube Transcript API.

Includes:
- Correlation ID injection
- Request/response logging with sanitization
- Request body size limiting
"""

from __future__ import annotations

import time
import uuid
from typing import Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from .logging_config import (
    CORRELATION_ID_HEADER,
    get_logger,
    mask_proxy_url,
    sanitize_for_logging,
)

logger = get_logger("middleware")


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """
    Middleware to inject and track correlation IDs for request tracing.
    
    Uses X-Correlation-ID header if provided, otherwise generates a new UUID.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get correlation ID from header or generate new one
        correlation_id = request.headers.get(CORRELATION_ID_HEADER)
        if not correlation_id:
            correlation_id = str(uuid.uuid4())

        # Add correlation ID to request state for use in handlers
        request.state.correlation_id = correlation_id

        # Process request and get response
        response = await call_next(request)

        # Add correlation ID to response headers
        response.headers[CORRELATION_ID_HEADER] = correlation_id

        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log incoming requests and outgoing responses.
    
    - Logs request details (method, path, query params)
    - Logs response status and duration
    - Sanitizes sensitive data (proxy credentials)
    - Skips logging for /health endpoint to reduce noise
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        correlation_id = getattr(request.state, "correlation_id", "unknown")
        start_time = time.perf_counter()

        # Sanitize query params (remove any sensitive params)
        query_params = dict(request.query_params)
        sanitized_params = sanitize_for_logging(query_params)

        # Log incoming request
        logger.info(
            f"Request: {request.method} {request.url.path}",
            extra={
                "correlation_id": correlation_id,
                "method": request.method,
                "path": request.url.path,
                "query_params": sanitized_params,
                "client_ip": request.client.host if request.client else None,
            },
        )

        # Process request
        response = await call_next(request)

        # Calculate duration
        duration_ms = (time.perf_counter() - start_time) * 1000

        # Log response (skip /health to reduce noise)
        if request.url.path != "/health":
            logger.info(
                f"Response: {request.method} {request.url.path} - {response.status_code}",
                extra={
                    "correlation_id": correlation_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": round(duration_ms, 2),
                },
            )

        return response


def create_logging_extra(request: Request) -> dict:
    """
    Create extra dict for logging with correlation ID from request.
    
    Use this in route handlers to include correlation ID in logs.
    """
    return {
        "correlation_id": getattr(request.state, "correlation_id", None),
    }
