"""Core endpoints."""

from fastapi import APIRouter

from app.api.v1.endpoints.core.users import router as users_router
from app.api.v1.endpoints.core.universes import router as universes_router
from app.api.v1.endpoints.core.scenes import router as scenes_router

router = APIRouter()
router.include_router(users_router, prefix="/users", tags=["users"])
router.include_router(universes_router, prefix="/universes", tags=["universes"])
router.include_router(scenes_router, prefix="/scenes", tags=["scenes"])
