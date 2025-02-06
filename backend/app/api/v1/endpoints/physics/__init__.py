"""Physics API endpoints."""

from fastapi import APIRouter
from app.api.v1.endpoints.physics.physics import router as physics_router
from app.api.v1.endpoints.physics.physics_parameters import router as physics_parameters_router

router = APIRouter()
router.include_router(physics_router, prefix="/physics", tags=["physics"])
router.include_router(physics_parameters_router, prefix="/physics/parameters", tags=["physics"])
