#!/usr/bin/env python3
"""
Script to update all model files to use GUID instead of PgUUID.
"""

import os
import re
from pathlib import Path

MODELS_DIR = Path(__file__).parent.parent / "app" / "models"

def update_file(file_path):
    """Update a single file to use GUID instead of PgUUID."""
    with open(file_path, 'r') as f:
        content = f.read()

    # Replace imports
    if 'from app.db.custom_types import GUID, JSONB' in content:
        content = content.replace(
            'from app.db.custom_types import GUID, JSONB',
            'from sqlalchemy.dialects.postgresql import JSONB\nfrom app.db.custom_types import GUID'
        )
    elif 'JSONB' in content:
        content = content.replace(
            'from sqlalchemy.dialects.postgresql import UUID as PgUUID, JSONB',
            'from sqlalchemy.dialects.postgresql import JSONB\nfrom app.db.custom_types import GUID'
        )
    else:
        content = content.replace(
            'from sqlalchemy.dialects.postgresql import UUID as PgUUID',
            'from app.db.custom_types import GUID'
        )

    # Add the import if it doesn't exist
    if 'from app.db.custom_types import GUID' not in content:
        import_section_end = content.find('\n\n', content.find('import'))
        if import_section_end == -1:
            import_section_end = len(content)
        content = content[:import_section_end] + '\nfrom app.db.custom_types import GUID' + content[import_section_end:]

    # Replace PgUUID with GUID in column definitions
    content = content.replace('PgUUID', 'GUID')

    with open(file_path, 'w') as f:
        f.write(content)

def main():
    """Update all model files."""
    for file_path in MODELS_DIR.glob('*.py'):
        if file_path.name != '__init__.py':
            print(f'Updating {file_path}...')
            update_file(file_path)

if __name__ == '__main__':
    main()
