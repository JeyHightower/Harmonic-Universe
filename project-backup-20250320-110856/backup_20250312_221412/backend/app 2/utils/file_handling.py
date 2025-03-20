"""File handling utility functions."""

import os
import shutil
import tempfile
from typing import Optional, List, Tuple
from pathlib import Path
import magic
import hashlib
from datetime import datetime

def get_file_mime_type(file_path: str) -> str:
    """Get MIME type of a file."""
    mime = magic.Magic(mime=True)
    return mime.from_file(file_path)

def get_file_hash(file_path: str, algorithm: str = 'sha256') -> str:
    """Calculate hash of a file."""
    hash_obj = hashlib.new(algorithm)
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b''):
            hash_obj.update(chunk)
    return hash_obj.hexdigest()

def ensure_directory(directory: str) -> None:
    """Ensure a directory exists, create if it doesn't."""
    os.makedirs(directory, exist_ok=True)

def safe_filename(filename: str) -> str:
    """Generate a safe filename."""
    # Remove potentially dangerous characters
    filename = "".join(c for c in filename if c.isalnum() or c in "._- ")
    # Add timestamp to ensure uniqueness
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    name, ext = os.path.splitext(filename)
    return f"{name}_{timestamp}{ext}"

def get_file_size(file_path: str) -> int:
    """Get file size in bytes."""
    return os.path.getsize(file_path)

def create_temp_copy(file_path: str) -> Tuple[str, tempfile._TemporaryFileWrapper]:
    """Create a temporary copy of a file."""
    temp_dir = tempfile.gettempdir()
    temp_file = tempfile.NamedTemporaryFile(delete=False)
    temp_path = temp_file.name

    shutil.copy2(file_path, temp_path)
    return temp_path, temp_file

def delete_file_safely(file_path: str) -> bool:
    """Safely delete a file."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
        return True
    except Exception:
        return False

def list_files_with_extension(directory: str, extension: str) -> List[str]:
    """List all files with a specific extension in a directory."""
    files = []
    for root, _, filenames in os.walk(directory):
        for filename in filenames:
            if filename.endswith(extension):
                files.append(os.path.join(root, filename))
    return files

def get_relative_path(file_path: str, base_path: str) -> str:
    """Get relative path from base path."""
    return os.path.relpath(file_path, base_path)

def move_file_safely(src: str, dst: str) -> bool:
    """Safely move a file to a new location."""
    try:
        # Ensure destination directory exists
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        # Move file
        shutil.move(src, dst)
        return True
    except Exception:
        return False

def backup_file(file_path: str, backup_dir: str) -> Optional[str]:
    """Create a backup of a file."""
    try:
        if not os.path.exists(file_path):
            return None

        # Create backup directory if it doesn't exist
        os.makedirs(backup_dir, exist_ok=True)

        # Generate backup filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = os.path.basename(file_path)
        backup_filename = f"{os.path.splitext(filename)[0]}_{timestamp}{os.path.splitext(filename)[1]}"
        backup_path = os.path.join(backup_dir, backup_filename)

        # Create backup
        shutil.copy2(file_path, backup_path)
        return backup_path
    except Exception:
        return None

def clean_temp_files(temp_dir: Optional[str] = None, max_age_hours: int = 24) -> int:
    """Clean temporary files older than specified age."""
    if temp_dir is None:
        temp_dir = tempfile.gettempdir()

    cleaned_count = 0
    current_time = datetime.now()

    for root, _, files in os.walk(temp_dir):
        for filename in files:
            file_path = os.path.join(root, filename)
            try:
                file_modified = datetime.fromtimestamp(os.path.getmtime(file_path))
                age = current_time - file_modified

                if age.total_seconds() > (max_age_hours * 3600):
                    os.remove(file_path)
                    cleaned_count += 1
            except Exception:
                continue

    return cleaned_count
