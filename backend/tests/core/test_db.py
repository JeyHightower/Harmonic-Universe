"""Test database configuration and connection."""

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import async_session, init_db
from app.core.config.test_settings import TestSettings

@pytest.mark.asyncio
async def test_database_connection():
    """Test that we can connect to the database and perform a simple query."""
    async with async_session() as session:
        result = await session.execute(text("SELECT 1"))
        assert result.scalar() == 1

@pytest.mark.asyncio
async def test_database_tables_exist(db: AsyncSession):
    """Test that all required database tables exist."""
    # Get list of all tables
    result = await db.execute(text(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema = 'public'"
    ))
    tables = [row[0] for row in result]

    # Required tables
    required_tables = [
        'users',
        'universes',
        'scenes',
        'audio_files',
        'ai_models',
        'ai_generations',
        'storyboards',
        'timelines',
        'music_parameters',
        'midi_events',
        'performance_metrics',
        'physics_parameters',
        'visualizations',
        'keyframes',
        'exports',
        'physics_constraints',
        'physics_objects',
        'scene_objects'
    ]

    # Check each required table exists
    for table in required_tables:
        assert table in tables, f"Table '{table}' not found in database"

@pytest.mark.asyncio
async def test_database_settings():
    """Test database settings are correctly configured."""
    settings = TestSettings()

    assert settings.DATABASE_URI.startswith('postgresql+asyncpg://'), \
        "Database URI should use asyncpg driver"
    assert 'test' in settings.DATABASE_URI.lower(), \
        "Test database should have 'test' in its name"

@pytest.mark.asyncio
async def test_database_initialization():
    """Test database initialization process."""
    # Initialize database
    await init_db()

    async with async_session() as session:
        # Verify we can perform a transaction
        async with session.begin():
            result = await session.execute(text("SELECT 1"))
            assert result.scalar() == 1
