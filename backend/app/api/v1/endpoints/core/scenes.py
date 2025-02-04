"""
Scene endpoints.
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[schemas.SceneResponse])
def read_scenes(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve scenes.
    """
    scenes = crud.scene.get_by_creator(
        db=db, creator_id=current_user.id, skip=skip, limit=limit
    )
    return scenes

@router.post("/", response_model=schemas.SceneResponse)
def create_scene(
    *,
    db: Session = Depends(deps.get_db),
    scene_in: schemas.SceneCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new scene.
    """
    universe = crud.universe.get(db=db, id=scene_in.universe_id)
    if not universe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Universe not found",
        )
    if not crud.universe.is_owner_or_collaborator(
        db=db, universe_id=universe.id, user_id=current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    scene = crud.scene.create_with_creator(
        db=db, obj_in=scene_in, creator_id=current_user.id
    )
    return scene

@router.get("/{scene_id}", response_model=schemas.SceneResponse)
def read_scene(
    *,
    db: Session = Depends(deps.get_db),
    scene_id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get scene by ID.
    """
    scene = crud.scene.get(db=db, id=scene_id)
    if not scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scene not found",
        )
    universe = crud.universe.get(db=db, id=scene.universe_id)
    if not crud.universe.is_owner_or_collaborator(
        db=db, universe_id=universe.id, user_id=current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return scene

@router.put("/{scene_id}", response_model=schemas.SceneResponse)
def update_scene(
    *,
    db: Session = Depends(deps.get_db),
    scene_id: str,
    scene_in: schemas.SceneUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update scene.
    """
    scene = crud.scene.get(db=db, id=scene_id)
    if not scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scene not found",
        )
    universe = crud.universe.get(db=db, id=scene.universe_id)
    if not crud.universe.is_owner_or_collaborator(
        db=db, universe_id=universe.id, user_id=current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    scene = crud.scene.update(db=db, db_obj=scene, obj_in=scene_in)
    return scene

@router.delete("/{scene_id}", response_model=schemas.SceneResponse)
def delete_scene(
    *,
    db: Session = Depends(deps.get_db),
    scene_id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete scene.
    """
    scene = crud.scene.get(db=db, id=scene_id)
    if not scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scene not found",
        )
    universe = crud.universe.get(db=db, id=scene.universe_id)
    if not crud.universe.is_owner_or_collaborator(
        db=db, universe_id=universe.id, user_id=current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    scene = crud.scene.remove(db=db, id=scene_id)
    return scene
