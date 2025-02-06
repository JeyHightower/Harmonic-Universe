"""AI model tests."""

import pytest
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.ai.ai_model import AIModel
from app.models.ai.ai_generation import AIGeneration

@pytest.mark.asyncio
async def test_create_ai_model(db: AsyncSession):
    """Test creating an AI model."""
    model = AIModel(
        name="test-model",
        description="Test AI model",
        model_type="text-to-scene",
        version="1.0.0",
        parameters={
            "temperature": 0.7,
            "max_tokens": 100,
            "top_p": 1.0
        },
        is_active=True
    )
    db.add(model)
    await db.commit()
    await db.refresh(model)

    assert model.id is not None
    assert model.name == "test-model"
    assert model.model_type == "text-to-scene"
    assert model.version == "1.0.0"
    assert model.is_active is True

@pytest.mark.asyncio
async def test_create_ai_generation(db: AsyncSession, test_user: Dict[str, Any]):
    """Test creating an AI generation."""
    # First create an AI model
    model = AIModel(
        name="test-model",
        description="Test AI model",
        model_type="text-to-scene",
        version="1.0.0",
        is_active=True
    )
    db.add(model)
    await db.commit()
    await db.refresh(model)

    # Create generation
    generation = AIGeneration(
        model_id=model.id,
        user_id=test_user["user"].id,
        prompt="Generate a test scene",
        parameters={
            "temperature": 0.7,
            "max_tokens": 100
        },
        result={
            "scene_data": {
                "objects": [],
                "lighting": {},
                "camera": {}
            }
        },
        status="completed",
        duration=1.5
    )
    db.add(generation)
    await db.commit()
    await db.refresh(generation)

    assert generation.id is not None
    assert generation.model_id == model.id
    assert generation.user_id == test_user["user"].id
    assert generation.prompt == "Generate a test scene"
    assert generation.status == "completed"

@pytest.mark.asyncio
async def test_ai_model_relationships(db: AsyncSession, test_user: Dict[str, Any]):
    """Test relationships between AI models and generations."""
    # Create model
    model = AIModel(
        name="test-model",
        description="Test AI model",
        model_type="text-to-scene",
        version="1.0.0",
        is_active=True
    )
    db.add(model)
    await db.commit()
    await db.refresh(model)

    # Create multiple generations
    generations = []
    for i in range(3):
        generation = AIGeneration(
            model_id=model.id,
            user_id=test_user["user"].id,
            prompt=f"Test generation {i}",
            status="completed"
        )
        db.add(generation)
        generations.append(generation)

    await db.commit()
    await db.refresh(model)

    # Test relationship
    assert len(model.generations) == 3
    for gen in model.generations:
        assert gen.model_id == model.id
        assert gen.user_id == test_user["user"].id

@pytest.mark.asyncio
async def test_update_ai_model(db: AsyncSession):
    """Test updating an AI model."""
    # Create model
    model = AIModel(
        name="test-model",
        description="Test AI model",
        model_type="text-to-scene",
        version="1.0.0",
        is_active=True
    )
    db.add(model)
    await db.commit()
    await db.refresh(model)

    # Update model
    model.name = "updated-model"
    model.version = "1.1.0"
    model.is_active = False
    await db.commit()
    await db.refresh(model)

    assert model.name == "updated-model"
    assert model.version == "1.1.0"
    assert model.is_active is False

@pytest.mark.asyncio
async def test_update_ai_generation(db: AsyncSession, test_user: Dict[str, Any]):
    """Test updating an AI generation."""
    # Create model and generation
    model = AIModel(name="test-model", model_type="text-to-scene", version="1.0.0")
    db.add(model)
    await db.commit()

    generation = AIGeneration(
        model_id=model.id,
        user_id=test_user["user"].id,
        prompt="Initial prompt",
        status="pending"
    )
    db.add(generation)
    await db.commit()
    await db.refresh(generation)

    # Update generation
    generation.status = "completed"
    generation.result = {"generated_data": "test"}
    generation.duration = 2.5
    await db.commit()
    await db.refresh(generation)

    assert generation.status == "completed"
    assert generation.result == {"generated_data": "test"}
    assert generation.duration == 2.5

@pytest.mark.asyncio
async def test_delete_ai_model_cascade(db: AsyncSession, test_user: Dict[str, Any]):
    """Test deleting an AI model cascades to generations."""
    # Create model and generations
    model = AIModel(name="test-model", model_type="text-to-scene", version="1.0.0")
    db.add(model)
    await db.commit()

    generation = AIGeneration(
        model_id=model.id,
        user_id=test_user["user"].id,
        prompt="Test prompt",
        status="completed"
    )
    db.add(generation)
    await db.commit()

    # Delete model
    await db.delete(model)
    await db.commit()

    # Verify model and generation are deleted
    assert await db.get(AIModel, model.id) is None
    assert await db.get(AIGeneration, generation.id) is None
