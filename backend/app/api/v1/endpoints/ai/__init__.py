"""AI endpoints."""

from fastapi import APIRouter

from app.api.v1.endpoints.ai.ai_models import router as ai_models_router
from app.api.v1.endpoints.ai.ai_generations import router as ai_generations_router

router = APIRouter()
router.include_router(ai_models_router, prefix="/ai-models", tags=["ai"])
router.include_router(ai_generations_router, prefix="/ai-generations", tags=["ai"])
