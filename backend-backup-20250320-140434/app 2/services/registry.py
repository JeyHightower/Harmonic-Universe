"""Service registry for managing service initialization and lifecycle."""

from typing import Dict, Type, Any
from contextlib import contextmanager
import threading
from ..core.logging import get_logger

logger = get_logger(__name__)

class ServiceRegistry:
    """Service registry for managing service initialization and lifecycle."""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        """Ensure singleton instance."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """Initialize service registry."""
        if not hasattr(self, '_initialized'):
            self._services: Dict[str, Any] = {}
            self._service_states: Dict[str, bool] = {}
            self._initialized = True

    def register(self, name: str, service_class: Type[Any], **kwargs) -> None:
        """Register a service with the registry."""
        if name in self._services:
            logger.warning(f"Service {name} already registered. Skipping.")
            return

        try:
            service_instance = service_class(**kwargs)
            self._services[name] = service_instance
            self._service_states[name] = False
            logger.info(f"Service {name} registered successfully")
        except Exception as e:
            logger.error(f"Failed to register service {name}: {str(e)}")
            raise

    def start_service(self, name: str) -> None:
        """Start a registered service."""
        if name not in self._services:
            raise KeyError(f"Service {name} not found in registry")

        if self._service_states[name]:
            logger.warning(f"Service {name} is already running")
            return

        service = self._services[name]
        try:
            if hasattr(service, 'start'):
                service.start()
            self._service_states[name] = True
            logger.info(f"Service {name} started successfully")
        except Exception as e:
            logger.error(f"Failed to start service {name}: {str(e)}")
            raise

    def stop_service(self, name: str) -> None:
        """Stop a running service."""
        if name not in self._services:
            raise KeyError(f"Service {name} not found in registry")

        if not self._service_states[name]:
            logger.warning(f"Service {name} is not running")
            return

        service = self._services[name]
        try:
            if hasattr(service, 'stop'):
                service.stop()
            self._service_states[name] = False
            logger.info(f"Service {name} stopped successfully")
        except Exception as e:
            logger.error(f"Failed to stop service {name}: {str(e)}")
            raise

    def get_service(self, name: str) -> Any:
        """Get a service instance by name."""
        if name not in self._services:
            raise KeyError(f"Service {name} not found in registry")
        return self._services[name]

    def list_services(self) -> Dict[str, bool]:
        """List all registered services and their states."""
        return {
            name: {
                'running': self._service_states[name],
                'type': type(service).__name__
            }
            for name, service in self._services.items()
        }

    @contextmanager
    def start_services(self, *service_names):
        """Context manager for starting multiple services."""
        started_services = []
        try:
            for name in service_names:
                self.start_service(name)
                started_services.append(name)
            yield
        finally:
            for name in reversed(started_services):
                try:
                    self.stop_service(name)
                except Exception as e:
                    logger.error(f"Error stopping service {name}: {str(e)}")

    def cleanup(self) -> None:
        """Clean up all services."""
        for name in list(self._services.keys()):
            try:
                if self._service_states[name]:
                    self.stop_service(name)
                del self._services[name]
                del self._service_states[name]
            except Exception as e:
                logger.error(f"Error cleaning up service {name}: {str(e)}")

# Global service registry instance
service_registry = ServiceRegistry()
