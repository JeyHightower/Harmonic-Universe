"""
Main API router configuration.
"""

from fastapi import APIRouter

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.core import router as core_router
from app.api.v1.endpoints.audio import router as audio_router
from app.api.v1.endpoints.physics import router as physics_router
from app.api.v1.endpoints.visualization import router as visualization_router
from app.api.v1.endpoints.ai import router as ai_router
from app.api.v1.endpoints.organization import router as organization_router

api_router = APIRouter()

# Include all routers
api_router.include_router(auth_router)
api_router.include_router(core_router)
api_router.include_router(audio_router)
api_router.include_router(physics_router)
api_router.include_router(visualization_router)
api_router.include_router(ai_router)
api_router.include_router(organization_router)
