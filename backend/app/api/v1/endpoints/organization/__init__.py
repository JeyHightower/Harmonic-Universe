"""Organization endpoints."""

from fastapi import APIRouter

from app.api.v1.endpoints.organization.storyboards import router as storyboards_router

router = APIRouter()
router.include_router(storyboards_router, prefix="/storyboards", tags=["organization"])
