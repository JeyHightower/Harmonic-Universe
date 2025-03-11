"""Comprehensive error handling system."""

from typing import Dict, Any, Optional, Type
from datetime import datetime
import traceback
import json
import os
from dataclasses import dataclass, asdict
from enum import Enum
from .logging import get_logger

logger = get_logger(__name__)


class ErrorSeverity(Enum):
    """Error severity levels."""

    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class ErrorCategory(Enum):
    """Error categories for classification."""

    VALIDATION = "validation"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    DATABASE = "database"
    NETWORK = "network"
    SYSTEM = "system"
    BUSINESS = "business"
    EXTERNAL = "external"


@dataclass
class ErrorContext:
    """Context information for errors."""

    timestamp: str
    request_id: Optional[str] = None
    user_id: Optional[int] = None
    path: Optional[str] = None
    method: Optional[str] = None
    params: Optional[Dict[str, Any]] = None
    headers: Optional[Dict[str, str]] = None


@dataclass
class ErrorReport:
    """Detailed error report."""

    error_id: str
    message: str
    code: str
    severity: ErrorSeverity
    category: ErrorCategory
    context: ErrorContext
    stack_trace: Optional[str] = None
    additional_data: Optional[Dict[str, Any]] = None


class ErrorTracker:
    """Tracks and manages error occurrences."""

    def __init__(self):
        """Initialize error tracker."""
        self.error_log_dir = "logs/errors"
        os.makedirs(self.error_log_dir, exist_ok=True)
        self._error_counts: Dict[str, int] = {}

    def track_error(self, error_report: ErrorReport) -> None:
        """Track an error occurrence."""
        error_key = f"{error_report.category.value}:{error_report.code}"
        self._error_counts[error_key] = self._error_counts.get(error_key, 0) + 1

        # Log error to file
        timestamp = datetime.now().strftime("%Y%m%d")
        log_file = os.path.join(self.error_log_dir, f"errors_{timestamp}.json")

        try:
            with open(log_file, "a") as f:
                f.write(json.dumps(asdict(error_report)) + "\n")
        except Exception as e:
            logger.error(f"Failed to log error: {str(e)}")

    def get_error_stats(self) -> Dict[str, Any]:
        """Get error statistics."""
        return {
            "counts": self._error_counts,
            "total": sum(self._error_counts.values()),
            "categories": {
                category: sum(
                    count
                    for key, count in self._error_counts.items()
                    if key.startswith(f"{category.value}:")
                )
                for category in ErrorCategory
            },
        }


class ErrorHandler:
    """Central error handler."""

    def __init__(self):
        """Initialize error handler."""
        self.tracker = ErrorTracker()
        self._error_mappings: Dict[Type[Exception], Dict[str, Any]] = {}

    def register_error(
        self,
        exception_class: Type[Exception],
        code: str,
        severity: ErrorSeverity,
        category: ErrorCategory,
        message_template: str,
    ) -> None:
        """Register an error type."""
        self._error_mappings[exception_class] = {
            "code": code,
            "severity": severity,
            "category": category,
            "message_template": message_template,
        }

    def handle_error(
        self, error: Exception, context: Optional[Dict[str, Any]] = None
    ) -> ErrorReport:
        """Handle an error and generate a report."""
        error_mapping = self._error_mappings.get(
            type(error),
            {
                "code": "UNKNOWN_ERROR",
                "severity": ErrorSeverity.ERROR,
                "category": ErrorCategory.SYSTEM,
                "message_template": str(error),
            },
        )

        error_context = ErrorContext(
            timestamp=datetime.now().isoformat(), **context if context else {}
        )

        report = ErrorReport(
            error_id=f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{os.urandom(4).hex()}",
            message=error_mapping["message_template"],
            code=error_mapping["code"],
            severity=error_mapping["severity"],
            category=error_mapping["category"],
            context=error_context,
            stack_trace=traceback.format_exc(),
            additional_data={"error_type": type(error).__name__},
        )

        self.tracker.track_error(report)
        return report

    def format_response(self, error_report: ErrorReport) -> Dict[str, Any]:
        """Format error report for API response."""
        return {
            "error": {
                "code": error_report.code,
                "message": error_report.message,
                "id": error_report.error_id,
                "category": error_report.category.value,
                "context": {
                    "timestamp": error_report.context.timestamp,
                    "request_id": error_report.context.request_id,
                },
            }
        }


# Global error handler instance
error_handler = ErrorHandler()

# Register common errors
error_handler.register_error(
    ValueError,
    "VALIDATION_ERROR",
    ErrorSeverity.WARNING,
    ErrorCategory.VALIDATION,
    "Invalid input provided: {error}",
)

error_handler.register_error(
    KeyError,
    "MISSING_FIELD",
    ErrorSeverity.WARNING,
    ErrorCategory.VALIDATION,
    "Required field missing: {error}",
)

error_handler.register_error(
    PermissionError,
    "PERMISSION_DENIED",
    ErrorSeverity.ERROR,
    ErrorCategory.AUTHORIZATION,
    "Permission denied: {error}",
)

error_handler.register_error(
    TimeoutError,
    "TIMEOUT",
    ErrorSeverity.ERROR,
    ErrorCategory.NETWORK,
    "Operation timed out: {error}",
)

__all__ = [
    "error_handler",
    "ErrorSeverity",
    "ErrorCategory",
    "ErrorContext",
    "ErrorReport",
]
