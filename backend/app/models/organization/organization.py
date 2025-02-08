"""
Organization models for user management and collaboration.
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    JSON,
    ForeignKey,
    Enum,
    Boolean,
    Table,
    Float,
    Text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.models.core.base import BaseModel

# Association tables
workspace_users = Table(
    "workspace_users",
    BaseModel.metadata,
    Column("workspace_id", UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE")),
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")),
    Column("role", String),  # admin, member, viewer
)

project_users = Table(
    "project_users",
    BaseModel.metadata,
    Column("project_id", UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE")),
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")),
    Column("role", String),  # admin, member, viewer
)

class ResourceType(str, enum.Enum):
    """Types of resources that can have permissions."""
    WORKSPACE = "workspace"
    PROJECT = "project"
    AUDIO = "audio"
    PHYSICS = "physics"
    VISUALIZATION = "visualization"
    AI_MODEL = "ai_model"

class Permission(BaseModel):
    """Permission definition."""
    __tablename__ = "permissions"

    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)
    resource_type = Column(Enum(ResourceType))
    actions = Column(JSON, default=list)  # List of allowed actions

    def __repr__(self):
        """String representation."""
        return f"<Permission(id={self.id}, name='{self.name}')>"

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "resource_type": self.resource_type.value,
            "actions": self.actions,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

class Role(BaseModel):
    """Role definition with associated permissions."""
    __tablename__ = "roles"

    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)
    permissions = Column(JSON, default=list)  # List of permission IDs
    is_system_role = Column(Boolean, default=False)

    def __repr__(self):
        """String representation."""
        return f"<Role(id={self.id}, name='{self.name}')>"

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "permissions": self.permissions,
            "is_system_role": self.is_system_role,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

class Workspace(BaseModel):
    """Workspace for organizing projects and resources."""
    __tablename__ = "workspaces"

    name = Column(String, index=True)
    description = Column(String, nullable=True)
    settings = Column(JSON, default=dict)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    is_personal = Column(Boolean, default=False)

    # Relationships
    projects = relationship("Project", back_populates="workspace", cascade="all, delete-orphan")
    users = relationship("User", secondary=workspace_users, backref="workspaces")

    def __repr__(self):
        """String representation."""
        return f"<Workspace(id={self.id}, name='{self.name}')>"

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "settings": self.settings,
            "created_by": self.created_by,
            "is_personal": self.is_personal,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

class Project(BaseModel):
    """Project within a workspace."""
    __tablename__ = "projects"

    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"))
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    settings = Column(JSON, default=dict)
    status = Column(String, default="active")  # active, archived, deleted
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    # Relationships
    workspace = relationship("Workspace", back_populates="projects")
    users = relationship("User", secondary=project_users, back_populates="projects")
    resources = relationship("Resource", back_populates="project", cascade="all, delete-orphan")
    audio_files = relationship("AudioFile", back_populates="project", cascade="all, delete-orphan")
    visualizations = relationship("Visualization", back_populates="project", cascade="all, delete-orphan")

    def __repr__(self):
        """String representation."""
        return f"<Project(id={self.id}, name='{self.name}')>"

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "workspace_id": self.workspace_id,
            "name": self.name,
            "description": self.description,
            "settings": self.settings,
            "status": self.status,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

class Resource(BaseModel):
    """Generic resource within a project."""
    __tablename__ = "resources"

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"))
    resource_type = Column(Enum(ResourceType))
    resource_id = Column(UUID(as_uuid=True))  # ID of the actual resource
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    resource_metadata = Column(JSON, default=dict)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    # Relationships
    project = relationship("Project", back_populates="resources")

    def __repr__(self):
        """String representation."""
        return f"<Resource(id={self.id}, type='{self.resource_type}', name='{self.name}')>"

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "project_id": self.project_id,
            "resource_type": self.resource_type.value,
            "resource_id": self.resource_id,
            "name": self.name,
            "description": self.description,
            "resource_metadata": self.resource_metadata,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

class Activity(BaseModel):
    """Activity log for tracking changes and collaboration."""
    __tablename__ = "activities"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    resource_type = Column(Enum(ResourceType))
    resource_id = Column(UUID(as_uuid=True))
    action = Column(String)  # created, updated, deleted, etc.
    timestamp = Column(Float)
    details = Column(JSON, default=dict)

    def __repr__(self):
        """String representation."""
        return f"<Activity(id={self.id}, user_id={self.user_id}, action='{self.action}')>"

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "resource_type": self.resource_type.value,
            "resource_id": self.resource_id,
            "action": self.action,
            "timestamp": self.timestamp,
            "details": self.details,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
