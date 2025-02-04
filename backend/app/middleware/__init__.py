"""Middleware initialization."""

from fastapi import FastAPI

from app.middleware.logging import LoggingMiddleware
from app.middleware.auth import AuthMiddleware
from app.middleware.cors import setup_cors


def setup_middleware(app: FastAPI) -> None:
    """Set up all middleware."""
    # Add CORS middleware
    setup_cors(app)

    # Add logging middleware
    app.add_middleware(LoggingMiddleware)

    # Add authentication middleware
    app.add_middleware(
        AuthMiddleware,
        exclude_paths=[
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api/v1/auth/login",
            "/api/v1/auth/register",
        ],
    )
