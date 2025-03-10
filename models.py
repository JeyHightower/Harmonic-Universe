#!/usr/bin/env python
"""
Models for Harmonic Universe
This file defines the database models for the application
"""
import os
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("models")

# Dummy DB class
class DummyDB:
    """A dummy database implementation"""

    def __init__(self):
        self.tables = {
            'users': [],
            'universes': [],
            'scenes': []
        }
        logger.info("Initialized dummy database")

    def init_app(self, app):
        """Initialize the database with the app"""
        logger.info("Initializing database with app")
        return self

    def create_all(self):
        """Create all tables"""
        logger.info("Creating all tables")
        return True

    def drop_all(self):
        """Drop all tables"""
        logger.info("Dropping all tables")
        self.tables = {
            'users': [],
            'universes': [],
            'scenes': []
        }
        return True

    def session(self):
        """Get a session"""
        logger.info("Getting session")
        return self

    def add(self, obj):
        """Add an object to the database"""
        logger.info(f"Adding object: {obj}")
        table = self.tables.get(obj.__tablename__, [])
        table.append(obj)
        return self

    def commit(self):
        """Commit the transaction"""
        logger.info("Committing transaction")
        return True

    def rollback(self):
        """Rollback the transaction"""
        logger.info("Rolling back transaction")
        return True

    def execute(self, *args, **kwargs):
        """Execute a query"""
        logger.info(f"Executing query: {args}, {kwargs}")
        return self

    def first(self):
        """Get the first result"""
        logger.info("Getting first result")
        return None

    def all(self):
        """Get all results"""
        logger.info("Getting all results")
        return []

# Create DB instance
db = DummyDB()

# Base model class
class Base:
    """Base model class"""
    query = db

    def __repr__(self):
        return f"<{self.__class__.__name__}>"

# User model
class User(Base):
    """User model"""
    __tablename__ = 'users'

    id = 'id'
    username = 'username'
    email = 'email'
    password_hash = 'password_hash'
    created_at = 'created_at'
    updated_at = 'updated_at'

    def __init__(self, username=None, email=None, password=None):
        self.username = username
        self.email = email
        self.password_hash = f"hash_of_{password}" if password else None
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        logger.info(f"Created User: {username}, {email}")

    def __repr__(self):
        return f"<User {self.username}>"

# Universe model
class Universe(Base):
    """Universe model"""
    __tablename__ = 'universes'

    id = 'id'
    name = 'name'
    description = 'description'
    user_id = 'user_id'
    created_at = 'created_at'
    updated_at = 'updated_at'

    def __init__(self, name=None, description=None, user_id=None):
        self.name = name
        self.description = description
        self.user_id = user_id
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        logger.info(f"Created Universe: {name}, {description}, {user_id}")

    def __repr__(self):
        return f"<Universe {self.name}>"

# Scene model
class Scene(Base):
    """Scene model"""
    __tablename__ = 'scenes'

    id = 'id'
    name = 'name'
    description = 'description'
    universe_id = 'universe_id'
    created_at = 'created_at'
    updated_at = 'updated_at'

    def __init__(self, name=None, description=None, universe_id=None):
        self.name = name
        self.description = description
        self.universe_id = universe_id
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        logger.info(f"Created Scene: {name}, {description}, {universe_id}")

    def __repr__(self):
        return f"<Scene {self.name}>"
