from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app import crud, models
from app.schemas.ai_generation import AIGeneration, AIGenerationCreate, AIGenerationUpdate
from app.models.ai.ai_generation import GenerationStatus
from app.models.ai.ai_model import AIModelType
from app.core.ai import process_generation
from app.api import deps

router = APIRouter()

@router.get("/universe/{universe_id}", response_model=List[AIGeneration])
def read_generations(
    universe_id: str,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve AI generations for a universe.
    """
    universe = crud.universe.get(db=db, id=universe_id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    generations = crud.ai_generation.get_by_universe(
        db=db, universe_id=universe.id, skip=skip, limit=limit
    )
    return generations

@router.post("/", response_model=AIGeneration)
def create_generation(
    *,
    db: Session = Depends(deps.get_db),
    generation_in: AIGenerationCreate,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new AI generation request.
    """
    # Check universe permissions
    universe = crud.universe.get(db=db, id=generation_in.universe_id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Check if AI model exists and is available
    ai_model = crud.ai_model.get(db=db, id=generation_in.model_id)
    if not ai_model:
        raise HTTPException(status_code=404, detail="AI model not found")
    if ai_model.model_type != generation_in.generation_type:
        raise HTTPException(
            status_code=400,
            detail=f"AI model type '{ai_model.model_type}' does not match generation type '{generation_in.generation_type}'",
        )

    # Create generation request
    generation = crud.ai_generation.create(db=db, obj_in=generation_in)

    # Start background processing
    background_tasks.add_task(process_generation, generation.id, db)

    return generation

@router.get("/type/{generation_type}", response_model=List[AIGeneration])
def read_generations_by_type(
    generation_type: AIModelType,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve AI generations by type.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    generations = crud.ai_generation.get_by_type(
        db=db, generation_type=generation_type, skip=skip, limit=limit
    )
    return generations

@router.get("/status/{status}", response_model=List[AIGeneration])
def read_generations_by_status(
    status: GenerationStatus,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve AI generations by status.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    generations = crud.ai_generation.get_by_status(
        db=db, status=status, skip=skip, limit=limit
    )
    return generations

@router.put("/{id}/approve", response_model=AIGeneration)
def approve_generation(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Approve an AI generation result.
    """
    generation = crud.ai_generation.get(db=db, id=id)
    if not generation:
        raise HTTPException(status_code=404, detail="AI generation not found")

    universe = crud.universe.get(db=db, id=generation.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    if generation.status != GenerationStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Generation is not completed")

    generation = crud.ai_generation.update(
        db=db,
        db_obj=generation,
        obj_in=AIGenerationUpdate(is_approved=True)
    )
    return generation

@router.get("/{id}", response_model=AIGeneration)
def read_generation(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get AI generation by ID.
    """
    generation = crud.ai_generation.get(db=db, id=id)
    if not generation:
        raise HTTPException(status_code=404, detail="AI generation not found")

    universe = crud.universe.get(db=db, id=generation.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return generation

@router.delete("/{id}")
def delete_generation(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete AI generation.
    """
    generation = crud.ai_generation.get(db=db, id=id)
    if not generation:
        raise HTTPException(status_code=404, detail="AI generation not found")

    universe = crud.universe.get(db=db, id=generation.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    generation = crud.ai_generation.remove(db=db, id=id)
    return {"status": "success"}
