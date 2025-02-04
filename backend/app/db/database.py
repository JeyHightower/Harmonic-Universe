"""Database configuration and connection management."""
from typing import AsyncGenerator, Generator
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    AsyncEngine,
    async_sessionmaker,
)
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool

from app.core.config import settings

# Support both SQLite and PostgreSQL
database_url = str(settings.SQLALCHEMY_DATABASE_URI)

if 'sqlite' in database_url:
    engine: AsyncEngine = create_async_engine(
        database_url,
        poolclass=NullPool,
        connect_args={"check_same_thread": False},
    )
else:
    engine: AsyncEngine = create_async_engine(
        database_url,
        poolclass=NullPool,
    )

# Create async session factory
SessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get an async database session."""
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# For synchronous operations (like migrations)
if 'sqlite' in database_url:
    sync_engine: Engine = create_engine(
        database_url.replace('+aiosqlite', ''),
        connect_args={"check_same_thread": False},
    )
else:
    sync_engine: Engine = create_engine(
        database_url.replace('+asyncpg', ''),
    )

# Create sync session factory
SyncSessionLocal = sessionmaker(
    sync_engine,
    class_=Session,
)

def get_sync_db() -> Generator[Session, None, None]:
    """Get a synchronous database session."""
    session = SyncSessionLocal()
    try:
        yield session
    finally:
        session.close()

def init_db() -> None:
    """Initialize database."""
    from app.db.base_class import Base
    Base.metadata.create_all(bind=sync_engine)

__all__ = ["SessionLocal", "SyncSessionLocal", "engine", "sync_engine", "init_db", "get_db", "get_sync_db"]
