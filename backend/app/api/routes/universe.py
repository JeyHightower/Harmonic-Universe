from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_current_user, get_db
from app.models.core.universe import Universe
from app.schemas.core.universe import Universe as UniverseSchema
from app.crud.universe import universe_crud

router = APIRouter()

@router.get("/{universe_id}", response_model=UniverseSchema)
def get_universe(
    universe_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    universe = universe_crud.get(db, universe_id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    return universe

@router.get("/", response_model=List[UniverseSchema])
def get_universes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    universes = universe_crud.get_multi(db, skip=skip, limit=limit)
    return universes

@router.post("/", response_model=UniverseSchema)
def create_universe(
    universe: UniverseSchema,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return universe_crud.create(db, obj_in=universe, user_id=current_user.id)

@router.put("/{universe_id}", response_model=UniverseSchema)
def update_universe(
    universe_id: int,
    universe: UniverseSchema,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_universe = universe_crud.get(db, universe_id)
    if not db_universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    if db_universe.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return universe_crud.update(db, db_obj=db_universe, obj_in=universe)

@router.delete("/{universe_id}")
def delete_universe(
    universe_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_universe = universe_crud.get(db, universe_id)
    if not db_universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    if db_universe.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    universe_crud.remove(db, id=universe_id)
    return {"status": "success"}
