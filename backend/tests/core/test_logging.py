"""Logging functionality tests."""

import pytest
import logging
import os
from pathlib import Path
from typing import Generator
import json
from app.core.logging import (
    setup_logging,
    get_logger,
    LogConfig,
    JsonFormatter
)

@pytest.fixture
def temp_log_file(tmp_path: Path) -> Generator[Path, None, None]:
    """Create a temporary log file."""
    log_file = tmp_path / "test.log"
    yield log_file
    if log_file.exists():
        log_file.unlink()

def test_log_configuration(temp_log_file: Path):
    """Test logging configuration setup."""
    config = LogConfig(
        level=logging.DEBUG,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        file_path=str(temp_log_file)
    )
    logger = setup_logging(config)

    assert logger.level == logging.DEBUG
    assert len(logger.handlers) == 2  # File and console handlers
    assert os.path.exists(temp_log_file)

def test_log_levels(temp_log_file: Path):
    """Test different logging levels."""
    logger = get_logger(__name__)
    logger.setLevel(logging.DEBUG)

    # Add file handler
    handler = logging.FileHandler(temp_log_file)
    handler.setFormatter(logging.Formatter("%(levelname)s: %(message)s"))
    logger.addHandler(handler)

    # Test all log levels
    logger.debug("Debug message")
    logger.info("Info message")
    logger.warning("Warning message")
    logger.error("Error message")
    logger.critical("Critical message")

    # Read log file and verify
    log_content = temp_log_file.read_text()
    assert "DEBUG: Debug message" in log_content
    assert "INFO: Info message" in log_content
    assert "WARNING: Warning message" in log_content
    assert "ERROR: Error message" in log_content
    assert "CRITICAL: Critical message" in log_content

def test_json_formatter():
    """Test JSON log formatter."""
    formatter = JsonFormatter()

    # Create a log record
    record = logging.LogRecord(
        name="test_logger",
        level=logging.INFO,
        pathname="test.py",
        lineno=1,
        msg="Test message",
        args=(),
        exc_info=None
    )

    # Format the record
    formatted = formatter.format(record)
    log_dict = json.loads(formatted)

    # Verify JSON structure
    assert log_dict["logger"] == "test_logger"
    assert log_dict["level"] == "INFO"
    assert log_dict["message"] == "Test message"
    assert "timestamp" in log_dict

def test_error_logging(temp_log_file: Path):
    """Test error logging with exception information."""
    logger = get_logger(__name__)
    handler = logging.FileHandler(temp_log_file)
    handler.setFormatter(logging.Formatter("%(levelname)s: %(message)s"))
    logger.addHandler(handler)

    try:
        raise ValueError("Test error")
    except ValueError as e:
        logger.exception("An error occurred")

    log_content = temp_log_file.read_text()
    assert "ERROR: An error occurred" in log_content
    assert "ValueError: Test error" in log_content
    assert "Traceback" in log_content

def test_custom_logger():
    """Test custom logger creation and usage."""
    logger = get_logger("custom_logger")

    # Verify logger properties
    assert logger.name == "custom_logger"
    assert logger.level == logging.INFO  # Default level
    assert len(logger.handlers) > 0

def test_log_filtering(temp_log_file: Path):
    """Test log filtering by level."""
    logger = get_logger(__name__)
    handler = logging.FileHandler(temp_log_file)
    handler.setLevel(logging.WARNING)  # Only log WARNING and above
    handler.setFormatter(logging.Formatter("%(levelname)s: %(message)s"))
    logger.addHandler(handler)

    # Log messages at different levels
    logger.debug("Debug message")
    logger.info("Info message")
    logger.warning("Warning message")
    logger.error("Error message")

    log_content = temp_log_file.read_text()
    assert "DEBUG: Debug message" not in log_content
    assert "INFO: Info message" not in log_content
    assert "WARNING: Warning message" in log_content
    assert "ERROR: Error message" in log_content

def test_contextual_logging(temp_log_file: Path):
    """Test logging with contextual information."""
    logger = get_logger(__name__)
    handler = logging.FileHandler(temp_log_file)

    class ContextFormatter(logging.Formatter):
        def format(self, record):
            record.user = getattr(record, "user", "unknown")
            record.request_id = getattr(record, "request_id", "none")
            return super().format(record)

    formatter = ContextFormatter(
        "%(levelname)s [%(user)s] [%(request_id)s]: %(message)s"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    # Log with context
    extra = {
        "user": "test_user",
        "request_id": "123"
    }
    logger.info("User action", extra=extra)

    log_content = temp_log_file.read_text()
    assert "INFO [test_user] [123]: User action" in log_content

def test_log_rotation(tmp_path: Path):
    """Test log file rotation."""
    from logging.handlers import RotatingFileHandler

    log_file = tmp_path / "rotating.log"
    logger = get_logger(__name__)

    # Create rotating handler (max 1KB, keep 3 backup files)
    handler = RotatingFileHandler(
        log_file,
        maxBytes=1024,
        backupCount=3
    )
    logger.addHandler(handler)

    # Generate enough logs to trigger rotation
    for i in range(100):
        logger.info("A" * 20)  # 20 bytes per message

    # Check that backup files were created
    assert log_file.exists()
    assert (tmp_path / "rotating.log.1").exists()

def test_log_cleanup(temp_log_file: Path):
    """Test log file cleanup."""
    logger = get_logger(__name__)
    handler = logging.FileHandler(temp_log_file)
    logger.addHandler(handler)

    # Write some logs
    logger.info("Test message")

    # Close handlers
    logger.handlers.clear()

    # Verify we can delete the file
    temp_log_file.unlink()
    assert not temp_log_file.exists()
