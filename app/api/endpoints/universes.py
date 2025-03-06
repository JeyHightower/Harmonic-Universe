from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.universe import Universe
from app.schemas.universe import Universe as UniverseSchema, UniverseCreate, UniverseUpdate

router = APIRouter()

@router.get("/", response_model=List[UniverseSchema])
def get_universes(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve universes.
    """
    universes = db.query(Universe).filter(
        (Universe.user_id == current_user) | (Universe.is_public == True)
    ).offset(skip).limit(limit).all()

    return universes

@router.post("/", response_model=UniverseSchema)
def create_universe(
    universe: UniverseCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
) -> Any:
    """
    Create new universe.
    """
    db_universe = Universe(**universe.dict(), user_id=current_user)
    db.add(db_universe)
    db.commit()
    db.refresh(db_universe)

    return db_universe

@router.get("/{universe_id}", response_model=UniverseSchema)
def get_universe(
    universe_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
) -> Any:
    """
    Get universe by ID.
    """
    universe = db.query(Universe).filter(Universe.id == universe_id).first()
    if not universe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Universe with ID {universe_id} not found",
        )

    if not universe.is_public and universe.user_id != current_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this universe",
        )

    return universe

@router.put("/{universe_id}", response_model=UniverseSchema)
def update_universe(
    universe_id: str,
    universe_update: UniverseUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
) -> Any:
    """
    Update a universe.
    """
    db_universe = db.query(Universe).filter(Universe.id == universe_id).first()
    if not db_universe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Universe with ID {universe_id} not found",
        )

    if db_universe.user_id != current_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to modify this universe",
        )

    update_data = universe_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_universe, field, value)

    db.commit()
    db.refresh(db_universe)

    return db_universe

@router.delete("/{universe_id}")
def delete_universe(
    universe_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
) -> Any:
    """
    Delete a universe.
    """
    db_universe = db.query(Universe).filter(Universe.id == universe_id).first()
    if not db_universe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Universe with ID {universe_id} not found",
        )

    if db_universe.user_id != current_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this universe",
        )

    db.delete(db_universe)
    db.commit()

    return {"message": "Universe deleted successfully"}
