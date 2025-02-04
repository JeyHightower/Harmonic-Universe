"""
Storyboard endpoints.
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[schemas.StoryboardWithDetails])
def read_storyboards(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve storyboards.
    """
    scene = crud.scene.get(db=db, id=current_user.active_scene_id)
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
    return crud.storyboard.get_by_scene(
        db=db, scene_id=scene.id, skip=skip, limit=limit
    )

@router.post("/", response_model=schemas.StoryboardWithDetails)
def create_storyboard(
    *,
    db: Session = Depends(deps.get_db),
    storyboard_in: schemas.StoryboardCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new storyboard.
    """
    scene = crud.scene.get(db=db, id=current_user.active_scene_id)
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
    return crud.storyboard.create_with_scene(
        db=db, obj_in=storyboard_in, scene_id=scene.id
    )

@router.get("/{storyboard_id}", response_model=schemas.StoryboardWithDetails)
def read_storyboard(
    *,
    db: Session = Depends(deps.get_db),
    storyboard_id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get storyboard by ID.
    """
    storyboard = crud.storyboard.get(db=db, id=storyboard_id)
    if not storyboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Storyboard not found",
        )
    scene = crud.scene.get(db=db, id=storyboard.scene_id)
    universe = crud.universe.get(db=db, id=scene.universe_id)
    if not crud.universe.is_owner_or_collaborator(
        db=db, universe_id=universe.id, user_id=current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return storyboard

@router.put("/{storyboard_id}", response_model=schemas.StoryboardWithDetails)
def update_storyboard(
    *,
    db: Session = Depends(deps.get_db),
    storyboard_id: str,
    storyboard_in: schemas.StoryboardUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update storyboard.
    """
    storyboard = crud.storyboard.get(db=db, id=storyboard_id)
    if not storyboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Storyboard not found",
        )
    scene = crud.scene.get(db=db, id=storyboard.scene_id)
    universe = crud.universe.get(db=db, id=scene.universe_id)
    if not crud.universe.is_owner_or_collaborator(
        db=db, universe_id=universe.id, user_id=current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return crud.storyboard.update(
        db=db, db_obj=storyboard, obj_in=storyboard_in
    )

@router.delete("/{storyboard_id}", response_model=schemas.StoryboardWithDetails)
def delete_storyboard(
    *,
    db: Session = Depends(deps.get_db),
    storyboard_id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete storyboard.
    """
    storyboard = crud.storyboard.get(db=db, id=storyboard_id)
    if not storyboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Storyboard not found",
        )
    scene = crud.scene.get(db=db, id=storyboard.scene_id)
    universe = crud.universe.get(db=db, id=scene.universe_id)
    if not crud.universe.is_owner_or_collaborator(
        db=db, universe_id=universe.id, user_id=current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return crud.storyboard.remove(db=db, id=storyboard_id)
