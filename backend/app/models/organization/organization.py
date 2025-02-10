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

user_roles = Table(
    "user_roles",
    BaseModel.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")),
    Column("role_id", UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE")),
)

class ResourceType(str, enum.Enum):
    """Types of resources that can have permissions."""
    WORKSPACE = "workspace"
    PROJECT = "project"
    AUDIO = "audio"
    PHYSICS = "physics"
    VISUALIZATION = "visualization"
    AI_MODEL = "ai_model"

class Permission(str, enum.Enum):
    """Permission levels for organization roles."""
    READ = "read"
    WRITE = "write"
    ADMIN = "admin"

class Role(BaseModel):
    """Role model for organization members."""
    __tablename__ = "roles"

    name = Column(String, nullable=False)
    description = Column(String)
    permissions = Column(JSON, nullable=False, default=lambda: [Permission.READ.value])
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))

    # Relationships
    organization = relationship("Organization", back_populates="roles")
    users = relationship("User", secondary="user_roles")

class Organization(BaseModel):
    """Organization model."""
    __tablename__ = "organizations"

    name = Column(String, nullable=False)
    description = Column(String)
    website = Column(String)
    logo_url = Column(String)
    is_active = Column(Boolean, default=True)

    # Relationships
    roles = relationship("Role", back_populates="organization", cascade="all, delete-orphan")
    workspaces = relationship("Workspace", back_populates="organization", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="organization", cascade="all, delete-orphan")

class Workspace(BaseModel):
    """Workspace model for organizing projects."""
    __tablename__ = "workspaces"

    name = Column(String, nullable=False)
    description = Column(String)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))

    # Relationships
    organization = relationship("Organization", back_populates="workspaces")
    projects = relationship("Project", back_populates="workspace", cascade="all, delete-orphan")

class Project(BaseModel):
    """Project model."""
    __tablename__ = "projects"

    name = Column(String, nullable=False)
    description = Column(String)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"))

    # Relationships
    organization = relationship("Organization", back_populates="projects")
    workspace = relationship("Workspace", back_populates="projects")
    resources = relationship("Resource", back_populates="project", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="project", cascade="all, delete-orphan")
    users = relationship("User", secondary="project_users", back_populates="projects")
    audio_files = relationship("AudioFile", back_populates="project", cascade="all, delete-orphan")
    visualizations = relationship("Visualization", back_populates="project", cascade="all, delete-orphan")

class Resource(BaseModel):
    """Resource model for project assets."""
    __tablename__ = "resources"

    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # file, link, etc.
    url = Column(String, nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"))

    # Relationships
    project = relationship("Project", back_populates="resources")

class Activity(BaseModel):
    """Activity model for tracking project activities."""
    __tablename__ = "activities"

    action = Column(String, nullable=False)
    description = Column(String)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))

    # Relationships
    project = relationship("Project", back_populates="activities")
    user = relationship("User", back_populates="activities")
