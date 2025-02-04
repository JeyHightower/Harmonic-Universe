"""
Universe endpoints.
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[schemas.UniverseResponse])
def read_universes(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve universes.
    """
    universes = crud.universe.get_accessible_universes(
        db=db, user_id=current_user.id, skip=skip, limit=limit
    )
    return universes

@router.post("/", response_model=schemas.UniverseResponse)
def create_universe(
    *,
    db: Session = Depends(deps.get_db),
    universe_in: schemas.UniverseCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new universe.
    """
    universe = crud.universe.create_with_owner(
        db=db, obj_in=universe_in, owner_id=current_user.id
    )
    return universe

@router.get("/{universe_id}", response_model=schemas.UniverseResponse)
def read_universe(
    *,
    db: Session = Depends(deps.get_db),
    universe_id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get universe by ID.
    """
    universe = crud.universe.get(db=db, id=universe_id)
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
    return universe

@router.put("/{universe_id}", response_model=schemas.UniverseResponse)
def update_universe(
    *,
    db: Session = Depends(deps.get_db),
    universe_id: str,
    universe_in: schemas.UniverseUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update universe.
    """
    universe = crud.universe.get(db=db, id=universe_id)
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
    universe = crud.universe.update(db=db, db_obj=universe, obj_in=universe_in)
    return universe

@router.delete("/{universe_id}", response_model=schemas.UniverseResponse)
def delete_universe(
    *,
    db: Session = Depends(deps.get_db),
    universe_id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete universe.
    """
    universe = crud.universe.get(db=db, id=universe_id)
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
    universe = crud.universe.remove(db=db, id=universe_id)
    return universe
