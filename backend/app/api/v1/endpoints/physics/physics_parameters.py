"""
Physics parameters routes.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.deps import get_current_user, get_async_db
from app.models.core.user import User
from app.models.core.scene import Scene
from app.models.physics.physics_parameter import PhysicsParameter
from app.schemas.physics import (
    PhysicsParameterCreate,
    PhysicsParameterUpdate,
    PhysicsParameterResponse
)

router = APIRouter()

@router.post("", response_model=PhysicsParameterResponse)
async def create_physics_parameters(
    params_in: PhysicsParameterCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """Create new physics parameters."""
    # Check if scene exists
    scene = await db.get(Scene, params_in.scene_id)
    if not scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scene not found"
        )

    # Check if parameters already exist for this scene
    existing_params = await db.execute(
        select(PhysicsParameter).where(PhysicsParameter.scene_id == params_in.scene_id)
    )
    if existing_params.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Physics parameters already exist for this scene"
        )

    # Create new parameters
    params = PhysicsParameter(**params_in.dict())
    db.add(params)
    await db.commit()
    await db.refresh(params)
    return params

@router.get("/{params_id}", response_model=PhysicsParameterResponse)
async def get_physics_parameters(
    params_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """Get physics parameters by ID."""
    params = await db.get(PhysicsParameter, params_id)
    if not params:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physics parameters not found"
        )
    return params

@router.get("/scene/{scene_id}", response_model=PhysicsParameterResponse)
async def get_scene_physics_parameters(
    scene_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """Get physics parameters for a scene."""
    params = await db.execute(
        select(PhysicsParameter).where(PhysicsParameter.scene_id == scene_id)
    )
    params = params.scalar_one_or_none()
    if not params:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physics parameters not found for this scene"
        )
    return params

@router.put("/{params_id}", response_model=PhysicsParameterResponse)
async def update_physics_parameters(
    params_id: int,
    params_in: PhysicsParameterUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """Update physics parameters."""
    params = await db.get(PhysicsParameter, params_id)
    if not params:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physics parameters not found"
        )

    # Update parameters
    for field, value in params_in.dict(exclude_unset=True).items():
        setattr(params, field, value)

    await db.commit()
    await db.refresh(params)
    return params

@router.delete("/{params_id}")
async def delete_physics_parameters(
    params_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """Delete physics parameters."""
    params = await db.get(PhysicsParameter, params_id)
    if not params:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physics parameters not found"
        )

    await db.delete(params)
    await db.commit()
    return {"status": "success"}

@router.get("/defaults/{scene_type}", response_model=PhysicsParameterResponse)
async def get_default_physics_parameters(
    scene_type: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """Get default physics parameters for a scene type."""
    # Define default parameters for different scene types
    defaults = {
        "space": {
            "gravity": 0.0,
            "air_resistance": 0.0,
            "collision_elasticity": 1.0,
            "friction": 0.0
        },
        "earth": {
            "gravity": 9.81,
            "air_resistance": 0.1,
            "collision_elasticity": 0.7,
            "friction": 0.3
        },
        "water": {
            "gravity": 9.81,
            "air_resistance": 0.5,
            "collision_elasticity": 0.3,
            "friction": 0.8
        }
    }

    if scene_type not in defaults:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No default parameters for scene type: {scene_type}"
        )

    return PhysicsParameter(
        scene_id=0,  # Placeholder
        **defaults[scene_type]
    )
