"""Apply fixes from error analysis."""

import json
from pathlib import Path
from typing import Dict, List
import shutil
from datetime import datetime

class FixApplier:
    """Applies fixes from error analysis."""

    def __init__(self, report_path: str = 'reports/error_analysis.json'):
        self.report_path = Path(report_path)
        self.backup_dir = Path('reports/backups')
        self.backup_dir.mkdir(exist_ok=True)

    def backup_file(self, file_path: Path):
        """Create backup of file before modifying."""
        if not file_path.exists():
            return

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_path = self.backup_dir / f"{file_path.name}.{timestamp}.bak"
        shutil.copy2(file_path, backup_path)

    def apply_fixes(self):
        """Apply fixes from error analysis report."""
        if not self.report_path.exists():
            print("No error analysis report found")
            return

        with open(self.report_path) as f:
            report = json.load(f)

        # Apply fixes in priority order
        for category in report['fix_order']:
            if category not in report['suggested_fixes']:
                continue

            print(f"\nApplying {category} fixes...")
            fixes = report['suggested_fixes'][category]

            for fix in fixes:
                file_path = Path(fix['file'])
                print(f"- Updating {file_path}")

                # Backup file
                self.backup_file(file_path)

                # Create directory if needed
                file_path.parent.mkdir(parents=True, exist_ok=True)

                # Apply fix
                if not file_path.exists():
                    file_path.write_text(fix['code'].strip())
                else:
                    self._update_file(file_path, fix)

    def _update_file(self, file_path: Path, fix: Dict):
        """Update existing file with fix."""
        content = file_path.read_text()

        # Simple replacement for now - could be enhanced with more sophisticated patching
        new_content = fix['code'].strip()

        if new_content not in content:
            file_path.write_text(new_content)

def main():
    """Apply fixes from error analysis."""
    applier = FixApplier()
    applier.apply_fixes()

if __name__ == '__main__':
    main()
