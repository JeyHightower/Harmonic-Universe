"""Authentication middleware."""

from typing import Optional
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp

from app.core.security import decode_access_token
from app.exceptions.base import AuthenticationError
from app.logging.config import get_logger

logger = get_logger(__name__)


class AuthMiddleware(BaseHTTPMiddleware):
    """Middleware for handling authentication."""

    def __init__(
        self,
        app: ASGIApp,
        exclude_paths: Optional[list[str]] = None,
    ):
        """Initialize middleware."""
        super().__init__(app)
        self.exclude_paths = exclude_paths or [
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api/v1/auth/login",
            "/api/v1/auth/register",
        ]

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """Process the request/response and handle authentication."""
        # Skip authentication for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)

        # Get authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            logger.warning("No authorization header found")
            raise AuthenticationError("No authorization header found")

        try:
            # Extract and validate token
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                logger.warning("Invalid authentication scheme")
                raise AuthenticationError("Invalid authentication scheme")

            # Decode and validate token
            payload = decode_access_token(token)

            # Add user info to request state
            request.state.user_id = payload.get("sub")
            request.state.is_superuser = payload.get("is_superuser", False)

            response = await call_next(request)
            return response

        except ValueError:
            logger.warning("Invalid authorization header format")
            raise AuthenticationError("Invalid authorization header format")
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}", exc_info=True)
            raise AuthenticationError("Invalid authentication credentials")
