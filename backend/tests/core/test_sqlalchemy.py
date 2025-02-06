"""
SQLAlchemy test configuration and basic tests.
"""

import pytest
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.core.scene import Scene
from app.models.core.scene import RenderingMode
from app.db.session import AsyncSessionLocal, async_engine

@pytest.mark.asyncio
async def test_database_operations(db: AsyncSession):
    """Test basic database operations with async SQLAlchemy."""
    try:
        async with AsyncSessionLocal() as session:
            # Create a test scene
            test_scene = Scene(
                id=uuid.uuid4(),
                name="Test Scene",
                description="A test scene",
                rendering_mode=RenderingMode.DRAFT,
                universe_id=uuid.uuid4(),
                creator_id=uuid.uuid4()
            )
            session.add(test_scene)
            await session.commit()
            await session.refresh(test_scene)

            # Query the scene
            stmt = select(Scene).where(Scene.name == "Test Scene")
            result = await session.execute(stmt)
            scene = result.scalar_one()

            assert scene is not None
            assert scene.name == "Test Scene"
            assert scene.rendering_mode == RenderingMode.DRAFT
            assert scene.description == "A test scene"

            print("✅ SQLAlchemy async operations successful!")

    except Exception as e:
        print(f"❌ SQLAlchemy async operations failed: {str(e)}")
        raise

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_database_operations())
