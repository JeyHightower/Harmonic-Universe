"""
Main API router configuration.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    users,
    universes,
    scenes,
    visualization,
    physics_parameters,
    music_parameters,
    storyboards
)

api_router = APIRouter()

# Include all API endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(universes.router, prefix="/universes", tags=["universes"])
api_router.include_router(scenes.router, prefix="/scenes", tags=["scenes"])
api_router.include_router(visualization.router, prefix="/visualization", tags=["visualization"])
api_router.include_router(physics_parameters.router, prefix="/physics", tags=["physics"])
api_router.include_router(music_parameters.router, prefix="/music", tags=["music"])
api_router.include_router(storyboards.router, prefix="/storyboards", tags=["storyboards"])
