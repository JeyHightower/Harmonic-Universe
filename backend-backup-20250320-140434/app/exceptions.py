"""Application exceptions module."""

from backend.app.core.errors import AppError


class UniverseNotFoundError(AppError):
    """Raised when a universe is not found."""

    def __init__(self, message: str = "Universe not found"):
        super().__init__(
            message=message, status_code=404, error_code="UNIVERSE_NOT_FOUND"
        )


class UnauthorizedError(AppError):
    """Raised when a user is not authorized to perform an action."""

    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message=message, status_code=401, error_code="UNAUTHORIZED")


class ValidationError(AppError):
    """Raised when validation fails."""

    def __init__(self, message: str = "Validation error"):
        super().__init__(
            message=message, status_code=400, error_code="VALIDATION_ERROR"
        )


class ResourceConflictError(AppError):
    """Raised when there is a conflict with an existing resource."""

    def __init__(self, message: str = "Resource conflict"):
        super().__init__(
            message=message, status_code=409, error_code="RESOURCE_CONFLICT"
        )


class AudioTrackNotFoundError(AppError):
    """Raised when an audio track is not found."""

    def __init__(self, message: str = "Audio track not found"):
        super().__init__(
            message=message, status_code=404, error_code="AUDIO_TRACK_NOT_FOUND"
        )


class PhysicsObjectNotFoundError(AppError):
    """Raised when a physics object is not found."""

    def __init__(self, message: str = "Physics object not found"):
        super().__init__(
            message=message, status_code=404, error_code="PHYSICS_OBJECT_NOT_FOUND"
        )
