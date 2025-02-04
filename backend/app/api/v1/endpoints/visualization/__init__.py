"""Visualization endpoints."""

from fastapi import APIRouter

from app.api.v1.endpoints.visualization.visualization import router as visualization_router
from app.api.v1.endpoints.visualization.keyframes import router as keyframes_router

router = APIRouter()
router.include_router(visualization_router, prefix="/visualizations", tags=["visualization"])
router.include_router(keyframes_router, prefix="/keyframes", tags=["visualization"])
