"""Structured logging for ResearchPilot.

Provides a configured logger with JSON-structured output for
consistent log parsing and debugging across all modules.
"""

from __future__ import annotations

import logging
import sys
from typing import Any

from utils.config import get_settings


class StructuredFormatter(logging.Formatter):
    """Formatter that outputs structured log lines."""

    def format(self, record: logging.LogRecord) -> str:
        """Format a log record as a structured string.

        Args:
            record: The log record to format.

        Returns:
            Formatted log string with timestamp, level, module, and message.
        """
        base = super().format(record)
        return base


def get_logger(name: str, **extra: Any) -> logging.Logger:
    """Get a configured logger for a module.

    Args:
        name: Logger name, typically __name__ of the calling module.
        **extra: Additional context fields (currently unused, for future structured output).

    Returns:
        Configured logging.Logger instance.
    """
    settings = get_settings()
    logger = logging.getLogger(name)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = StructuredFormatter(
            fmt="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(getattr(logging, settings.log_level.upper(), logging.INFO))
        logger.propagate = False

    return logger
