"""
Middleware for global error handling and request processing.
"""

from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from .errors import (
    BaseAppError,
    DatabaseError,
    handle_app_error,
    ValidationError,
    NotFoundError,
    AuthenticationError,
    AuthorizationError
)

async def error_handling_middleware(request: Request, call_next: Callable) -> Response:
    """Global error handling middleware."""
    try:
        return await call_next(request)
    except ValidationError as e:
        return JSONResponse(
            status_code=e.status_code,
            content=handle_app_error(e)
        )
    except NotFoundError as e:
        return JSONResponse(
            status_code=e.status_code,
            content=handle_app_error(e)
        )
    except AuthenticationError as e:
        return JSONResponse(
            status_code=e.status_code,
            content=handle_app_error(e)
        )
    except AuthorizationError as e:
        return JSONResponse(
            status_code=e.status_code,
            content=handle_app_error(e)
        )
    except SQLAlchemyError as e:
        db_error = DatabaseError(str(e), details={"original_error": str(e.__cause__)})
        return JSONResponse(
            status_code=db_error.status_code,
            content=handle_app_error(db_error)
        )
    except BaseAppError as e:
        return JSONResponse(
            status_code=e.status_code,
            content=handle_app_error(e)
        )
    except Exception as e:
        error = BaseAppError(str(e))
        return JSONResponse(
            status_code=error.status_code,
            content=handle_app_error(error)
        )

class RequestValidationMiddleware:
    """Middleware for request validation and processing."""

    async def __call__(self, request: Request, call_next: Callable) -> Response:
        try:
            # Add request validation logic here if needed
            response = await call_next(request)
            return response
        except Exception as e:
            if isinstance(e, BaseAppError):
                return JSONResponse(
                    status_code=e.status_code,
                    content=handle_app_error(e)
                )
            error = BaseAppError(str(e))
            return JSONResponse(
                status_code=error.status_code,
                content=handle_app_error(error)
            )
