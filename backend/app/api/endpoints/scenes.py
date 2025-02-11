from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api import deps
from app.crud import crud_scene
from app.schemas.scene import Scene, SceneCreate, SceneUpdate

router = APIRouter()

class ReorderRequest(BaseModel):
    universe_id: str
    scene_ids: List[str]

@router.get("/", response_model=List[Scene])
def get_scenes(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    universe_id: Optional[str] = Query(None),
    creator_id: Optional[str] = Query(None),
):
    """
    Retrieve scenes with optional filtering.
    """
    if universe_id:
        return crud_scene.get_by_universe(db, universe_id=universe_id)
    if creator_id:
        return crud_scene.get_by_creator(db, creator_id=creator_id)
    return crud_scene.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=Scene)
def create_scene(
    *,
    db: Session = Depends(deps.get_db),
    scene_in: SceneCreate,
    current_user = Depends(deps.get_current_user),
):
    """
    Create new scene.
    """
    scene = crud_scene.create_with_creator(
        db=db, obj_in=scene_in, creator_id=current_user.id
    )
    return scene

@router.get("/{scene_id}", response_model=Scene)
def get_scene(
    scene_id: str,
    db: Session = Depends(deps.get_db),
):
    """
    Get scene by ID.
    """
    scene = crud_scene.get(db, id=scene_id)
    if not scene:
        raise HTTPException(
            status_code=404,
            detail="Scene not found",
        )
    return scene

@router.put("/{scene_id}", response_model=Scene)
def update_scene(
    *,
    db: Session = Depends(deps.get_db),
    scene_id: str,
    scene_in: SceneUpdate,
    current_user = Depends(deps.get_current_user),
):
    """
    Update scene.
    """
    scene = crud_scene.get(db, id=scene_id)
    if not scene:
        raise HTTPException(
            status_code=404,
            detail="Scene not found",
        )
    if scene.creator_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    scene = crud_scene.update(db, db_obj=scene, obj_in=scene_in)
    return scene

@router.delete("/{scene_id}")
def delete_scene(
    *,
    db: Session = Depends(deps.get_db),
    scene_id: str,
    current_user = Depends(deps.get_current_user),
):
    """
    Delete scene.
    """
    scene = crud_scene.get(db, id=scene_id)
    if not scene:
        raise HTTPException(
            status_code=404,
            detail="Scene not found",
        )
    if scene.creator_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    crud_scene.remove(db, id=scene_id)
    return {"status": "success"}

@router.post("/reorder", response_model=List[Scene])
def reorder_scenes(
    *,
    db: Session = Depends(deps.get_db),
    reorder_data: ReorderRequest,
    current_user = Depends(deps.get_current_user),
):
    """
    Reorder scenes within a universe.
    """
    scenes = crud_scene.reorder(
        db=db,
        universe_id=reorder_data.universe_id,
        scene_ids=reorder_data.scene_ids,
        current_user_id=current_user.id,
    )
    return scenes
