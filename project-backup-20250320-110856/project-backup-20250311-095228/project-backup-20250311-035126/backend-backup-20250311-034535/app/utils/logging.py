"""Logging utility functions."""

import logging
import sys
import os
from datetime import datetime
from typing import Optional, Dict, Any, Union, List, Tuple
import json
from pathlib import Path
import traceback
from functools import wraps
import time


# Configure basic logging
def setup_logger(
    name: str,
    log_file: Optional[str] = None,
    level: int = logging.INFO,
    format_string: Optional[str] = None,
) -> logging.Logger:
    """Set up a logger with the specified configuration."""
    if format_string is None:
        format_string = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Create formatter
    formatter = logging.Formatter(format_string)

    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # Create file handler if log file is specified
    if log_file:
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger


def log_exception(
    logger: logging.Logger, exc: Exception, context: Optional[Dict[str, Any]] = None
) -> None:
    """Log an exception with optional context."""
    exc_info = sys.exc_info()

    log_data = {
        "exception_type": exc.__class__.__name__,
        "exception_message": str(exc),
        "traceback": traceback.format_exception(*exc_info) if exc_info[0] else None,
        "timestamp": datetime.utcnow().isoformat(),
        "context": context,
    }

    logger.error(json.dumps(log_data, indent=2))


def rotate_logs(
    log_dir: Union[str, Path], max_size_mb: float = 10.0, max_files: int = 5
) -> None:
    """Rotate log files when they exceed the specified size."""
    log_dir = Path(log_dir)
    for log_file in log_dir.glob("*.log"):
        if log_file.stat().st_size > (max_size_mb * 1024 * 1024):
            # Rotate existing rotated logs
            for i in range(max_files - 1, 0, -1):
                old_file = log_file.with_suffix(f".log.{i}")
                new_file = log_file.with_suffix(f".log.{i + 1}")
                if old_file.exists():
                    if i == max_files - 1:
                        old_file.unlink()
                    else:
                        old_file.rename(new_file)

            # Rotate current log file
            log_file.rename(log_file.with_suffix(".log.1"))


def log_to_json(
    logger: logging.Logger,
    level: int,
    message: str,
    extra: Optional[Dict[str, Any]] = None,
) -> None:
    """Log a message with extra data in JSON format."""
    log_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "message": message,
        "level": logging.getLevelName(level),
        **(extra or {}),
    }

    logger.log(level, json.dumps(log_data))


def log_performance(logger: logging.Logger):
    """Decorator to log function performance."""

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            result = func(*args, **kwargs)
            end_time = time.time()

            log_data = {
                "function": func.__name__,
                "execution_time": end_time - start_time,
                "timestamp": datetime.utcnow().isoformat(),
                "args": str(args),
                "kwargs": str(kwargs),
            }

            logger.info(f"Performance log: {json.dumps(log_data)}")
            return result

        return wrapper

    return decorator


def sanitize_log_data(
    data: Dict[str, Any], sensitive_fields: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Sanitize sensitive data before logging."""
    if sensitive_fields is None:
        sensitive_fields = ["password", "token", "secret", "key", "auth"]

    sanitized = {}
    for key, value in data.items():
        if any(sensitive in key.lower() for sensitive in sensitive_fields):
            sanitized[key] = "***REDACTED***"
        elif isinstance(value, dict):
            sanitized[key] = sanitize_log_data(value, sensitive_fields)
        else:
            sanitized[key] = value

    return sanitized


def create_audit_log(
    logger: logging.Logger,
    action: str,
    user: str,
    resource: str,
    details: Optional[Dict[str, Any]] = None,
) -> None:
    """Create an audit log entry."""
    log_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "action": action,
        "user": user,
        "resource": resource,
        "details": details or {},
    }

    logger.info(f"AUDIT: {json.dumps(log_data)}")


def log_request(logger: logging.Logger, request, response) -> None:
    """Log HTTP request and response details."""
    log_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "request": {
            "method": request.method,
            "path": request.path,
            "headers": dict(request.headers),
            "query_params": dict(request.args),
            "remote_addr": request.remote_addr,
        },
        "response": {
            "status_code": response.status_code,
            "headers": dict(response.headers),
        },
    }

    logger.info(f"Request log: {json.dumps(sanitize_log_data(log_data))}")


def setup_error_email_handler(
    logger: logging.Logger,
    smtp_host: str,
    smtp_port: int,
    from_addr: str,
    to_addrs: List[str],
    subject: str,
    credentials: Optional[Tuple[str, str]] = None,
) -> None:
    """Set up email handler for error logs."""
    from logging.handlers import SMTPHandler

    mail_handler = SMTPHandler(
        mailhost=(smtp_host, smtp_port),
        fromaddr=from_addr,
        toaddrs=to_addrs,
        subject=subject,
        credentials=credentials,
    )
    mail_handler.setLevel(logging.ERROR)
    logger.addHandler(mail_handler)
