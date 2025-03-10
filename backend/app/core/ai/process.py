from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from backend.app import crud, schemas
from backend.app.models.ai_model import AIModelType
from backend.app.models.ai_generation import GenerationStatus
from .parameter_generation import generate_parameters
from .music_generation import generate_music
from .visualization_generation import generate_visualization

async def process_generation(generation_id: UUID, db: Session) -> None:
    """
    Process an AI generation request.
    """
    # Get generation request
    generation = crud.ai_generation.get(db=db, id=generation_id)
    if not generation:
        return

    # Update status to processing
    crud.ai_generation.update(
        db=db,
        db_obj=generation,
        obj_in=schemas.AIGenerationUpdate(status=GenerationStatus.PROCESSING)
    )

    try:
        # Get AI model
        ai_model = crud.ai_model.get(db=db, id=generation.model_id)
        if not ai_model:
            raise ValueError("AI model not found")

        # Process based on generation type
        output_data = None
        if generation.generation_type == AIModelType.PARAMETER_GENERATION:
            output_data = await generate_parameters(generation.input_data, ai_model)
        elif generation.generation_type == AIModelType.MUSIC_GENERATION:
            output_data = await generate_music(generation.input_data, ai_model)
        elif generation.generation_type == AIModelType.VISUALIZATION:
            output_data = await generate_visualization(generation.input_data, ai_model)
        else:
            raise ValueError(f"Unsupported generation type: {generation.generation_type}")

        # Update generation with results
        crud.ai_generation.update(
            db=db,
            db_obj=generation,
            obj_in=schemas.AIGenerationUpdate(
                status=GenerationStatus.COMPLETED,
                output_data=output_data
            )
        )

    except Exception as e:
        # Update generation with error
        crud.ai_generation.update(
            db=db,
            db_obj=generation,
            obj_in=schemas.AIGenerationUpdate(
                status=GenerationStatus.FAILED,
                error_message=str(e)
            )
        )
