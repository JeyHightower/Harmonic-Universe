#!/usr/bin/env python3
"""Unified maintenance script for the backend."""

import argparse
import os
import sys
import subprocess
from typing import List, Dict, Any
import json
from datetime import datetime
import logging
import shutil

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

class Maintainer:
    """Handles maintenance tasks for the backend."""

    def __init__(self):
        """Initialize maintainer."""
        self.root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    def analyze_imports(self) -> Dict[str, Any]:
        """Analyze Python imports for issues."""
        try:
            result = subprocess.run(
                ['isort', '--check-only', '--diff', self.root_dir],
                capture_output=True,
                text=True
            )

            return {
                'status': 'success' if result.returncode == 0 else 'issues_found',
                'output': result.stdout,
                'errors': result.stderr
            }
        except Exception as e:
            logger.error(f"Import analysis failed: {str(e)}")
            return {'status': 'error', 'error': str(e)}

    def find_duplicates(self) -> Dict[str, List[str]]:
        """Find duplicate files in the project."""
        duplicates = {}
        file_hashes = {}

        for root, _, files in os.walk(self.root_dir):
            for filename in files:
                if filename.endswith(('.py', '.sh', '.sql')):
                    filepath = os.path.join(root, filename)
                    try:
                        with open(filepath, 'rb') as f:
                            content = f.read()
                            file_hash = hash(content)
                            if file_hash in file_hashes:
                                if file_hash not in duplicates:
                                    duplicates[file_hash] = [file_hashes[file_hash]]
                                duplicates[file_hash].append(filepath)
                            else:
                                file_hashes[file_hash] = filepath
                    except Exception as e:
                        logger.error(f"Error reading {filepath}: {str(e)}")

        return duplicates

    def cleanup_temp_files(self) -> Dict[str, Any]:
        """Clean up temporary and cache files."""
        patterns = [
            '**/__pycache__',
            '**/*.pyc',
            '**/*.pyo',
            '**/.pytest_cache',
            '**/.coverage',
            '**/celerybeat-schedule'
        ]

        cleaned_files = []
        for pattern in patterns:
            for path in self.root_dir.glob(pattern):
                try:
                    if os.path.isfile(path):
                        os.remove(path)
                    else:
                        shutil.rmtree(path)
                    cleaned_files.append(str(path))
                except Exception as e:
                    logger.error(f"Error cleaning {path}: {str(e)}")

        return {
            'status': 'success',
            'cleaned_files': cleaned_files
        }

    def analyze_dependencies(self) -> Dict[str, Any]:
        """Analyze project dependencies."""
        try:
            # Check for outdated packages
            result = subprocess.run(
                ['pip', 'list', '--outdated', '--format=json'],
                capture_output=True,
                text=True
            )
            outdated = json.loads(result.stdout)

            # Check for security vulnerabilities
            safety_result = subprocess.run(
                ['safety', 'check', '--json'],
                capture_output=True,
                text=True
            )
            vulnerabilities = json.loads(safety_result.stdout)

            return {
                'status': 'success',
                'outdated_packages': outdated,
                'vulnerabilities': vulnerabilities
            }
        except Exception as e:
            logger.error(f"Dependency analysis failed: {str(e)}")
            return {'status': 'error', 'error': str(e)}

    def organize_imports(self) -> Dict[str, Any]:
        """Organize imports in Python files."""
        try:
            subprocess.run(
                ['isort', self.root_dir],
                check=True
            )
            return {'status': 'success'}
        except Exception as e:
            logger.error(f"Import organization failed: {str(e)}")
            return {'status': 'error', 'error': str(e)}

    def run_all_maintenance(self) -> Dict[str, Any]:
        """Run all maintenance tasks."""
        results = {
            'imports': self.analyze_imports(),
            'duplicates': self.find_duplicates(),
            'cleanup': self.cleanup_temp_files(),
            'dependencies': self.analyze_dependencies()
        }

        # Generate report
        report_path = os.path.join(
            self.root_dir,
            'reports',
            f'maintenance_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        )

        with open(report_path, 'w') as f:
            json.dump(results, f, indent=2)

        return {
            'status': 'success',
            'report_path': report_path,
            'results': results
        }

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Maintain the backend")
    parser.add_argument(
        '--task',
        choices=['all', 'imports', 'duplicates', 'cleanup', 'dependencies'],
        default='all',
        help='Maintenance task to run'
    )
    args = parser.parse_args()

    maintainer = Maintainer()

    if args.task == 'all':
        results = maintainer.run_all_maintenance()
    elif args.task == 'imports':
        results = maintainer.analyze_imports()
    elif args.task == 'duplicates':
        results = maintainer.find_duplicates()
    elif args.task == 'cleanup':
        results = maintainer.cleanup_temp_files()
    elif args.task == 'dependencies':
        results = maintainer.analyze_dependencies()

    print(json.dumps(results, indent=2))

if __name__ == '__main__':
    main()
