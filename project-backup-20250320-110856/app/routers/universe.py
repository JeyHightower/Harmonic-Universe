from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.auth import get_current_user
from app.database import get_db
from app.models import Universe
from app.schemas import UniverseCreate, UniverseResponse

router = APIRouter()

@router.get("/", response_model=List[UniverseResponse])
async def get_universes(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    # Get universes visible to current user
    return db.query(Universe).filter(
        (Universe.user_id == current_user) | (Universe.is_public == True)
    ).all()

@router.post("/", response_model=UniverseResponse, status_code=status.HTTP_201_CREATED)
async def create_universe(
    universe: UniverseCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    # Create a new universe
    new_universe = Universe(**universe.dict(), user_id=current_user)
    db.add(new_universe)
    db.commit()
    db.refresh(new_universe)
    return new_universe

# Add other CRUD operations here
