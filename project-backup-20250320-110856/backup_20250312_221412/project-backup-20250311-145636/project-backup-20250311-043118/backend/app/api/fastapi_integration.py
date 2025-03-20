"""
FastAPI integration with Flask using WSGI to ASGI adapters.
"""

from fastapi import FastAPI
from starlette.middleware.wsgi import WSGIMiddleware
from flask import Flask
import nest_asyncio
import logging

# Initialize logging
logger = logging.getLogger(__name__)

# Initialize nest_asyncio to allow nested event loops (needed for FastAPI in Flask)
nest_asyncio.apply()

# Create FastAPI instance for the /api path
fastapi_app = FastAPI(
    title="Harmonic Universe API",
    description="Advanced features API for Harmonic Universe",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


def mount_fastapi_app(flask_app: Flask) -> Flask:
    """
    Integrates FastAPI routers with the Flask app.

    Args:
        flask_app: The Flask application instance

    Returns:
        The Flask app with FastAPI routes registered
    """
    try:
        # Import the routers
        from backend.app.api.routes.music import router as music_router

        # Add routers to the FastAPI app
        fastapi_app.include_router(music_router, prefix="/api")

        # Import Flask-specific middleware to handle the integration
        from flask import request, Response
        import asyncio
        import uvicorn
        from asgiref.wsgi import WsgiToAsgi

        # Middleware for handling API requests
        @flask_app.route(
            "/api/music/<path:path>", methods=["GET", "POST", "PUT", "DELETE"]
        )
        def proxy_to_fastapi(path):
            """
            Proxy requests to /api/music/* to the FastAPI app
            """
            logger.debug(f"Proxying request to FastAPI: {path}")

            # Route the request to FastAPI
            from starlette.requests import Request
            from starlette.responses import Response as StarletteResponse

            async def _call_fastapi():
                path_with_query = (
                    request.full_path if request.query_string else request.path
                )
                scope = {
                    "type": "http",
                    "http_version": "1.1",
                    "method": request.method,
                    "path": path_with_query,
                    "root_path": "",
                    "scheme": request.scheme,
                    "query_string": request.query_string,
                    "headers": [
                        (k.lower().encode(), v.encode())
                        for k, v in request.headers.items()
                    ],
                    "client": (request.remote_addr, 0),
                    "server": (
                        request.host.split(":")[0],
                        int(request.host.split(":")[1]) if ":" in request.host else 80,
                    ),
                }

                req = Request(scope)
                resp = await fastapi_app(scope, lambda *args: None, lambda *args: None)
                return resp

            response = asyncio.run(_call_fastapi())
            return Response(
                response.body,
                status=response.status_code,
                headers=dict(response.headers),
            )

        logger.info("FastAPI integration successful")

    except Exception as e:
        logger.error(f"FastAPI integration failed: {e}")
        import traceback

        logger.error(traceback.format_exc())

    return flask_app


def get_fastapi_app() -> FastAPI:
    """
    Returns the FastAPI application.
    """
    return fastapi_app
