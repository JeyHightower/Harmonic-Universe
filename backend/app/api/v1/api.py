"""
API router configuration.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import physics

api_router = APIRouter()

# Include physics endpoints
api_router.include_router(physics.router, prefix="/physics", tags=["physics"])
