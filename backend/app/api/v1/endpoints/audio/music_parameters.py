"""
Music parameters endpoints.
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[schemas.MusicParameter])
def read_music_parameters(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve music parameters.
    """
    universe = crud.universe.get(db=db, id=current_user.active_universe_id)
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
    return crud.music_parameter.get_by_universe(
        db=db, universe_id=universe.id, skip=skip, limit=limit
    )

@router.post("/", response_model=schemas.MusicParameter)
def create_music_parameter(
    *,
    db: Session = Depends(deps.get_db),
    parameter_in: schemas.MusicParameterCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new music parameter.
    """
    universe = crud.universe.get(db=db, id=current_user.active_universe_id)
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
    return crud.music_parameter.create_with_universe(
        db=db, obj_in=parameter_in, universe_id=universe.id
    )

@router.get("/{parameter_id}", response_model=schemas.MusicParameter)
def read_music_parameter(
    *,
    db: Session = Depends(deps.get_db),
    parameter_id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get music parameter by ID.
    """
    parameter = crud.music_parameter.get(db=db, id=parameter_id)
    if not parameter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Music parameter not found",
        )
    universe = crud.universe.get(db=db, id=parameter.universe_id)
    if not crud.universe.is_owner_or_collaborator(
        db=db, universe_id=universe.id, user_id=current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return parameter

@router.put("/{parameter_id}", response_model=schemas.MusicParameter)
def update_music_parameter(
    *,
    db: Session = Depends(deps.get_db),
    parameter_id: str,
    parameter_in: schemas.MusicParameterUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update music parameter.
    """
    parameter = crud.music_parameter.get(db=db, id=parameter_id)
    if not parameter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Music parameter not found",
        )
    universe = crud.universe.get(db=db, id=parameter.universe_id)
    if not crud.universe.is_owner_or_collaborator(
        db=db, universe_id=universe.id, user_id=current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return crud.music_parameter.update(
        db=db, db_obj=parameter, obj_in=parameter_in
    )

@router.delete("/{parameter_id}", response_model=schemas.MusicParameter)
def delete_music_parameter(
    *,
    db: Session = Depends(deps.get_db),
    parameter_id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete music parameter.
    """
    parameter = crud.music_parameter.get(db=db, id=parameter_id)
    if not parameter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Music parameter not found",
        )
    universe = crud.universe.get(db=db, id=parameter.universe_id)
    if not crud.universe.is_owner_or_collaborator(
        db=db, universe_id=universe.id, user_id=current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return crud.music_parameter.remove(db=db, id=parameter_id)
