"""
Organization models for user management and collaboration.
"""

from sqlalchemy import Column, Integer, String, JSON, ForeignKey, Enum, Boolean, Table
from sqlalchemy.orm import relationship
import enum
from app.db.base_class import Base

# Association tables
workspace_users = Table(
    "workspace_users",
    Base.metadata,
    Column("workspace_id", Integer, ForeignKey("workspaces.id", ondelete="CASCADE")),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE")),
    Column("role", String),  # admin, member, viewer
)

project_users = Table(
    "project_users",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id", ondelete="CASCADE")),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE")),
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

class Permission(Base):
    """Permission definition."""
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)
    resource_type = Column(Enum(ResourceType))
    actions = Column(JSON, default=list)  # List of allowed actions

    def __repr__(self):
        """String representation."""
        return f"<Permission(id={self.id}, name='{self.name}')>"

class Role(Base):
    """Role definition with associated permissions."""
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)
    permissions = Column(JSON, default=list)  # List of permission IDs
    is_system_role = Column(Boolean, default=False)

    def __repr__(self):
        """String representation."""
        return f"<Role(id={self.id}, name='{self.name}')>"

class Workspace(Base):
    """Workspace for organizing projects and resources."""
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    settings = Column(JSON, default=dict)
    created_by = Column(Integer, ForeignKey("users.id"))
    is_personal = Column(Boolean, default=False)

    # Relationships
    projects = relationship("Project", back_populates="workspace", cascade="all, delete-orphan")
    users = relationship("User", secondary=workspace_users, backref="workspaces")

    def __repr__(self):
        """String representation."""
        return f"<Workspace(id={self.id}, name='{self.name}')>"

class Project(Base):
    """Project within a workspace."""
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"))
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    settings = Column(JSON, default=dict)
    status = Column(String, default="active")  # active, archived, deleted
    created_by = Column(Integer, ForeignKey("users.id"))

    # Relationships
    workspace = relationship("Workspace", back_populates="projects")
    users = relationship("User", secondary=project_users, backref="projects")
    resources = relationship("Resource", back_populates="project", cascade="all, delete-orphan")

    def __repr__(self):
        """String representation."""
        return f"<Project(id={self.id}, name='{self.name}')>"

class Resource(Base):
    """Generic resource within a project."""
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    resource_type = Column(Enum(ResourceType))
    resource_id = Column(Integer)  # ID of the actual resource
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    metadata = Column(JSON, default=dict)
    created_by = Column(Integer, ForeignKey("users.id"))

    # Relationships
    project = relationship("Project", back_populates="resources")

    def __repr__(self):
        """String representation."""
        return f"<Resource(id={self.id}, type='{self.resource_type}', name='{self.name}')>"

class Activity(Base):
    """Activity log for tracking changes and collaboration."""
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    resource_type = Column(Enum(ResourceType))
    resource_id = Column(Integer)
    action = Column(String)  # created, updated, deleted, etc.
    timestamp = Column(Float)
    details = Column(JSON, default=dict)

    def __repr__(self):
        """String representation."""
        return f"<Activity(id={self.id}, user_id={self.user_id}, action='{self.action}')>"
