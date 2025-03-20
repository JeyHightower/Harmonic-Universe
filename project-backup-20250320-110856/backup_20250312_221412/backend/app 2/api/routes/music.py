from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from backend.app.services.music_generator import generate_music_from_params
from backend.app.api.dependencies.auth import get_current_user
from backend.app.db.repositories.universe import UniverseRepository
from backend.app.api.dependencies.database import get_repository

router = APIRouter(prefix="/music", tags=["music"])

@router.get("/{universe_id}/generate", response_model=Dict[str, Any])
async def generate_music(
    universe_id: str,
    current_user = Depends(get_current_user),
    universe_repo: UniverseRepository = Depends(get_repository(UniverseRepository))
):
    """
    Generate music based on the harmony and physics parameters of a universe.
    Returns notes, tempo, and other musical elements.
    """
    # Get universe to access harmony parameters
    universe = await universe_repo.get_universe_by_id(universe_id)

    if not universe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Universe not found"
        )

    # Check if user has access to this universe
    if universe.user_id != current_user.id and not universe.is_public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this universe"
        )

    # Generate music parameters based on universe parameters
    music_data = generate_music_from_params(universe.harmony_params, universe.physics_params)

    return {
        "universe_id": universe_id,
        "music_data": music_data
    }
