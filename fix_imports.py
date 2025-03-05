#!/usr/bin/env python3
"""
Fix imports in the backend Python files
This script replaces 'from app' with 'from backend.app' and 'import app' with 'import backend.app'
"""
import os
import re
import sys

def fix_imports_in_file(filepath):
    """Fix imports in a single file."""
    try:
        # Try to read the file with UTF-8 encoding
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Replace imports
        orig_content = content
        # Careful not to replace imports inside strings or comments
        # Using regex to match only standalone 'from app' or 'import app'
        content = re.sub(r'(?<!\S)from\s+app(?=[\.\s])', r'from backend.app', content)
        content = re.sub(r'(?<!\S)import\s+app(?=[\.\s])', r'import backend.app', content)

        # If the content changed, write it back
        if content != orig_content:
            print(f"Fixing imports in {filepath}")
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except UnicodeDecodeError:
        # Skip files that are not UTF-8 encoded (likely binary files)
        print(f"Skipping binary or non-UTF-8 file: {filepath}")
        return False
    except Exception as e:
        print(f"Error processing file {filepath}: {e}")
        return False

def fix_imports_in_directory(directory, extensions=('.py',)):
    """Fix imports in all files in a directory recursively."""
    fixed_count = 0
    for root, dirs, files in os.walk(directory):
        # Skip virtual environment directories
        if 'venv' in dirs:
            dirs.remove('venv')
        if '__pycache__' in dirs:
            dirs.remove('__pycache__')
        if '.git' in dirs:
            dirs.remove('.git')

        for filename in files:
            if any(filename.endswith(ext) for ext in extensions):
                filepath = os.path.join(root, filename)
                if fix_imports_in_file(filepath):
                    fixed_count += 1
    return fixed_count

if __name__ == "__main__":
    backend_dir = 'backend'
    if not os.path.isdir(backend_dir):
        print(f"Error: Directory {backend_dir} not found")
        sys.exit(1)

    print(f"Fixing imports in {backend_dir}...")
    fixed_count = fix_imports_in_directory(backend_dir)
    print(f"Fixed imports in {fixed_count} files")
    print("Done!")
