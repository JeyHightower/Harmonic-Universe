"""Central model registry to prevent duplicate registrations."""

from typing import Any, Dict, Type
from sqlalchemy.orm import registry as sa_registry
from sqlalchemy.orm.decl_api import DeclarativeMeta

class ModelRegistry:
    """Singleton registry for SQLAlchemy models."""

    def __init__(self):
        """Initialize registry."""
        self._sa_registry = sa_registry()
        self._models: Dict[str, Type[Any]] = {}

    def register(self, model: Type[Any]) -> Type[Any]:
        """Register model with full path to prevent duplicates."""
        model_path = f"{model.__module__}.{model.__name__}"

        if model_path in self._models:
            return self._models[model_path]

        if isinstance(model, DeclarativeMeta):
            self._sa_registry.configure()

        self._models[model_path] = model
        return model

    def get_registry(self) -> sa_registry:
        """Get SQLAlchemy registry."""
        return self._sa_registry

    def get_model(self, name: str) -> Type[Any]:
        """Get registered model by name."""
        return self._models.get(name)

# Create singleton instance
registry = ModelRegistry()
