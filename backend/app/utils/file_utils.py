"""
File utility functions.
"""

import os
from pathlib import Path
import shutil
from typing import Union

def ensure_directory_exists(path: Union[str, Path]) -> None:
    """
    Ensure that a directory exists, creating it if necessary.

    Args:
        path: Directory path as string or Path object
    """
    if isinstance(path, str):
        path = Path(path)
    path.mkdir(parents=True, exist_ok=True)

def delete_directory(path: Union[str, Path]) -> None:
    """
    Delete a directory and all its contents.

    Args:
        path: Directory path as string or Path object
    """
    if isinstance(path, str):
        path = Path(path)
    if path.exists():
        shutil.rmtree(path)

def get_file_size(path: Union[str, Path]) -> int:
    """
    Get the size of a file in bytes.

    Args:
        path: File path as string or Path object

    Returns:
        File size in bytes
    """
    if isinstance(path, str):
        path = Path(path)
    return path.stat().st_size

def get_file_extension(path: Union[str, Path]) -> str:
    """
    Get the file extension without the dot.

    Args:
        path: File path as string or Path object

    Returns:
        File extension without the dot
    """
    if isinstance(path, str):
        path = Path(path)
    return path.suffix.lstrip('.')

def is_valid_file_type(path: Union[str, Path], allowed_extensions: list[str]) -> bool:
    """
    Check if a file has an allowed extension.

    Args:
        path: File path as string or Path object
        allowed_extensions: List of allowed extensions without dots

    Returns:
        True if file has an allowed extension, False otherwise
    """
    return get_file_extension(path).lower() in [ext.lower() for ext in allowed_extensions]
