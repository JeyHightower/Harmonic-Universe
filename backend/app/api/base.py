from fastapi import APIRouter

from app.api.endpoints import users, universes, scenes

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(universes.router, prefix="/universes", tags=["universes"])
api_router.include_router(scenes.router, prefix="/scenes", tags=["scenes"])
