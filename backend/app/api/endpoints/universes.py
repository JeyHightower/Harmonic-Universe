from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import crud_universe
from app.schemas.universe import Universe, UniverseCreate, UniverseUpdate

router = APIRouter()

@router.get("/", response_model=List[Universe])
def get_universes(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    owner_id: Optional[str] = Query(None),
    is_public: Optional[bool] = Query(None),
    name: Optional[str] = Query(None),
):
    """
    Retrieve universes with optional filtering.
    """
    if owner_id:
        return crud_universe.get_by_owner(db, owner_id=owner_id)
    if is_public is not None:
        return crud_universe.get_public(db)
    if name:
        return crud_universe.search_by_name(db, name=name)
    return crud_universe.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=Universe)
def create_universe(
    *,
    db: Session = Depends(deps.get_db),
    universe_in: UniverseCreate,
    current_user = Depends(deps.get_current_user),
):
    """
    Create new universe.
    """
    universe = crud_universe.create_with_owner(
        db=db, obj_in=universe_in, owner_id=current_user.id
    )
    return universe

@router.get("/{universe_id}", response_model=Universe)
def get_universe(
    universe_id: str,
    db: Session = Depends(deps.get_db),
):
    """
    Get universe by ID.
    """
    universe = crud_universe.get(db, id=universe_id)
    if not universe:
        raise HTTPException(
            status_code=404,
            detail="Universe not found",
        )
    return universe

@router.put("/{universe_id}", response_model=Universe)
def update_universe(
    *,
    db: Session = Depends(deps.get_db),
    universe_id: str,
    universe_in: UniverseUpdate,
    current_user = Depends(deps.get_current_user),
):
    """
    Update universe.
    """
    universe = crud_universe.get(db, id=universe_id)
    if not universe:
        raise HTTPException(
            status_code=404,
            detail="Universe not found",
        )
    if universe.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    universe = crud_universe.update(db, db_obj=universe, obj_in=universe_in)
    return universe

@router.delete("/{universe_id}")
def delete_universe(
    *,
    db: Session = Depends(deps.get_db),
    universe_id: str,
    current_user = Depends(deps.get_current_user),
):
    """
    Delete universe.
    """
    universe = crud_universe.get(db, id=universe_id)
    if not universe:
        raise HTTPException(
            status_code=404,
            detail="Universe not found",
        )
    if universe.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    crud_universe.remove(db, id=universe_id)
    return {"status": "success"}
