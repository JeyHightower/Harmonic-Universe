"""Tests for database setup and initialization."""

import pytest
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import inspect

from app.db.base import Base
from app.models import __all__ as model_names
from app.core.config import settings
from app.db.init_db import init_db, verify_all_models_registered

def test_all_models_registered(db_session):
    """Test that all models are properly registered."""
    # This should not raise any exceptions
    verify_all_models_registered()

    # Get all table names from the database
    inspector = inspect(db_session.get_bind())
    actual_tables = set(inspector.get_table_names())

    # Get expected table names from models
    expected_tables = set(model.__table__.name for model_name in model_names
                         if hasattr((model := globals().get(model_name)), '__table__'))

    # Check if all expected tables exist
    missing_tables = expected_tables - actual_tables
    assert not missing_tables, f"Missing tables in database: {missing_tables}"

def test_database_tables_created(db_session):
    """Test that all database tables are created with correct columns."""
    inspector = inspect(db_session.get_bind())

    for model_name in model_names:
        model = globals().get(model_name)
        if not hasattr(model, '__table__'):
            continue

        table_name = model.__table__.name
        assert table_name in inspector.get_table_names(), f"Table {table_name} not found in database"

        # Check columns
        columns = {col['name'] for col in inspector.get_columns(table_name)}
        model_columns = {col.name for col in model.__table__.columns}

        missing_columns = model_columns - columns
        assert not missing_columns, f"Missing columns in table {table_name}: {missing_columns}"

def test_database_constraints(db_session):
    """Test that database constraints are properly set up."""
    inspector = inspect(db_session.get_bind())

    for model_name in model_names:
        model = globals().get(model_name)
        if not hasattr(model, '__table__'):
            continue

        table_name = model.__table__.name

        # Check primary keys
        pk = inspector.get_pk_constraint(table_name)
        assert pk['constrained_columns'], f"No primary key found for table {table_name}"

        # Check foreign keys
        fks = inspector.get_foreign_keys(table_name)
        expected_fks = [fk for fk in model.__table__.foreign_keys]

        assert len(fks) == len(expected_fks), \
            f"Mismatch in number of foreign keys for table {table_name}"

def test_superuser_creation(db_session):
    """Test that superuser is created properly."""
    from app.models.user import User

    superuser = db_session.query(User).filter(
        User.email == settings.FIRST_SUPERUSER_EMAIL
    ).first()

    assert superuser is not None, "Superuser not created"
    assert superuser.is_superuser, "Superuser flag not set"
    assert superuser.is_active, "Superuser not active"
    assert superuser.email_verified, "Superuser email not verified"

def test_database_session(db_session):
    """Test basic database session operations."""
    from app.models.user import User

    # Test insert
    test_user = User(
        email="test@example.com",
        username="testuser",
        full_name="Test User",
        is_active=True,
        is_superuser=False,
        email_verified=True,
        hashed_password="dummyhash"
    )

    db_session.add(test_user)
    db_session.commit()

    # Test query
    queried_user = db_session.query(User).filter(User.email == "test@example.com").first()
    assert queried_user is not None, "Failed to query inserted user"
    assert queried_user.username == "testuser", "Retrieved incorrect user data"

    # Test update
    queried_user.full_name = "Updated Name"
    db_session.commit()

    updated_user = db_session.query(User).filter(User.email == "test@example.com").first()
    assert updated_user.full_name == "Updated Name", "Failed to update user"

    # Test delete
    db_session.delete(queried_user)
    db_session.commit()

    deleted_user = db_session.query(User).filter(User.email == "test@example.com").first()
    assert deleted_user is None, "Failed to delete user"
