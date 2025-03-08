from fastapi import APIRouter

from app.api.endpoints import auth, universes, scenes, physics_parameters, audio

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(universes.router, prefix="/universes", tags=["universes"])
api_router.include_router(scenes.router, prefix="/scenes", tags=["scenes"])
api_router.include_router(physics_parameters.router, prefix="/physics-parameters", tags=["physics parameters"])
api_router.include_router(audio.router, prefix="/audio", tags=["audio"])
