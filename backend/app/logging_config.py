"""
Structured logging configuration for the YouTube Transcript API.

Provides:
- JSON formatted logging
- Correlation ID middleware for request tracing
- Log rotation (daily, keep 7 days)
- Request/response logging (sanitized)
"""

from __future__ import annotations

import json
import logging
import os
import sys
from datetime import datetime, timezone
from logging.handlers import TimedRotatingFileHandler
from typing import Any
from uuid import uuid4

# Correlation ID header name
CORRELATION_ID_HEADER = "X-Correlation-ID"


class JSONFormatter(logging.Formatter):
    """Format log records as JSON with correlation ID support."""

    def format(self, record: logging.LogRecord) -> str:
        log_data: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add correlation ID if present
        if hasattr(record, "correlation_id") and record.correlation_id:
            log_data["correlation_id"] = record.correlation_id

        # Add extra fields
        extra_fields = {
            k: v
            for k, v in record.__dict__.items()
            if k not in (
                "name",
                "msg",
                "args",
                "created",
                "filename",
                "funcName",
                "levelname",
                "levelno",
                "lineno",
                "module",
                "msecs",
                "message",
                "pathname",
                "process",
                "processName",
                "relativeCreated",
                "thread",
                "threadName",
                "exc_info",
                "exc_text",
                "stack_info",
            )
        }
        if extra_fields:
            log_data["extra"] = extra_fields

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)


def setup_logging(log_level: str | None = None) -> logging.Logger:
    """
    Configure structured JSON logging with rotation.
    
    Returns the configured root logger.
    """
    logger = logging.getLogger("yt_transcript_api")
    level = log_level or os.getenv("LOG_LEVEL", "INFO")
    logger.setLevel(getattr(logging, level.upper()))

    # Remove existing handlers
    logger.handlers.clear()

    # Console handler with JSON formatter
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(JSONFormatter())
    logger.addHandler(console_handler)

    # File handler with rotation (daily, keep 7 days)
    log_dir = os.getenv("LOG_DIR", "logs")
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "yt-transcript-api.log")

    file_handler = TimedRotatingFileHandler(
        log_file,
        when="midnight",
        interval=1,
        backupCount=7,
        encoding="utf-8",
    )
    file_handler.setFormatter(JSONFormatter())
    logger.addHandler(file_handler)

    return logger


def get_logger(name: str | None = None) -> logging.Logger:
    """Get a logger instance for the given name."""
    if name:
        return logging.getLogger(f"yt_transcript_api.{name}")
    return logging.getLogger("yt_transcript_api")


def sanitize_for_logging(data: dict[str, Any]) -> dict[str, Any]:
    """
    Sanitize sensitive data from dictionaries before logging.
    
    Currently sanitizes proxy URLs by masking credentials.
    """
    sanitized = data.copy()
    
    # Check for proxy URLs and mask credentials
    for key, value in sanitized.items():
        if isinstance(value, str):
            # Check if it's a proxy URL with credentials
            if "proxy" in key.lower() and ("@" in value or "://" in value):
                sanitized[key] = mask_proxy_url(value)
    
    return sanitized


def mask_proxy_url(url: str) -> str:
    """
    Mask user:pass credentials in proxy URLs.
    
    Examples:
        http://user:pass@host:port -> http://***@host:port
        http://user:pass@proxy.example.com:8080 -> http://***@proxy.example.com:8080
        socks5://user:pass@host:port -> socks5://***@host:port
    """
    if not url:
        return url
    
    import re
    
    # Pattern to match credentials in URLs
    # Matches: protocol://user:pass@host:port or protocol://user:pass@host
    pattern = r"(://)([^:@]+:[^@]+)(@)"
    
    def replace_credentials(match):
        return match.group(1) + "***" + match.group(3)
    
    return re.sub(pattern, replace_credentials, url)
