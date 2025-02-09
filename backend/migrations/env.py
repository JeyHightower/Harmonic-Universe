import logging
from logging.config import fileConfig
import os
from dotenv import load_dotenv

from flask import current_app
from app.db.session import Base, get_database_url

# Import all models to ensure they are registered with Base
from app.models import (
    User,
    Universe,
    Scene,
    AudioFile,
    AudioTrack,
    AudioMarker,
    AudioAutomation,
    MIDISequence,
    MIDIEvent,
    Visualization,
    PhysicsObject,
    PhysicsParameter,
    PhysicsConstraint,
    AIModel,
    TrainingSession,
    InferenceResult,
    Dataset,
    Permission,
    Role,
    Workspace,
    Project,
    Resource,
    Activity
)

from alembic import context

# Load environment variables
load_dotenv()

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)
logger = logging.getLogger('alembic.env')

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# Get the database URL from our configuration
database_url = get_database_url()
config.set_main_option('sqlalchemy.url', database_url)

def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode."""
    from sqlalchemy import create_engine

    # Create engine directly
    engine = create_engine(database_url)

    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
