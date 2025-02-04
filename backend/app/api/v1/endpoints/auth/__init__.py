"""Authentication endpoints."""

from fastapi import APIRouter

from app.api.v1.endpoints.auth.auth import router as auth_router
from app.api.v1.endpoints.auth.login import router as login_router

router = APIRouter()
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(login_router, prefix="/login", tags=["auth"])
