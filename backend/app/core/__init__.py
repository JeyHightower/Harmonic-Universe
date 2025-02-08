"""Core package initialization."""

from .config.settings import Settings

settings = Settings()

__all__ = ["settings"]
