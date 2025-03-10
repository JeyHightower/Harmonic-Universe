"""Test error analyzer and fixer."""

import re
import sys
from pathlib import Path
from typing import Dict, List, NamedTuple, Set
from dataclasses import dataclass
import subprocess
import json
from collections import defaultdict
from datetime import datetime

@dataclass
class ErrorCategory:
    """Error category with severity and patterns."""
    name: str
    severity: int  # Lower is more severe
    patterns: List[str]
    description: str
    fix_function: str

class ErrorAnalyzer:
    """Analyzes test errors and suggests fixes."""

    def __init__(self):
        self.categories = {
            'model_registration': ErrorCategory(
                name="Model Registration",
                severity=1,
                patterns=[
                    r"Multiple classes found for path.*?in the registry",
                    r"One or more mappers failed to initialize",
                    r"NoReferencedTableError.*?table.*?not found"
                ],
                description="SQLAlchemy model registration and mapping issues",
                fix_function="fix_model_registration"
            ),
            'route_errors': ErrorCategory(
                name="Route Errors",
                severity=2,
                patterns=[
                    r"assert 404 == \d+",
                    r"HTTP/1.1 404 Not Found",
                    r"Method Not Allowed"
                ],
                description="Flask route and blueprint issues",
                fix_function="fix_route_errors"
            ),
            'async_errors': ErrorCategory(
                name="Async/Event Loop",
                severity=3,
                patterns=[
                    r"RuntimeError: Working outside of application context",
                    r"RuntimeError: Working outside of request context",
                    r"ScopeMismatch"
                ],
                description="Flask context and request handling issues",
                fix_function="fix_async_errors"
            ),
            'config_errors': ErrorCategory(
                name="Configuration",
                severity=4,
                patterns=[
                    r"AssertionError: assert.*?==",
                    r"AttributeError: '.*?' object has no attribute",
                    r"ImportError: cannot import name"
                ],
                description="Configuration and import issues",
                fix_function="fix_config_errors"
            )
        }
        self.errors = defaultdict(list)
        self.fixes = defaultdict(list)

    def analyze_pytest_output(self, output: str):
        """Analyze pytest output and categorize errors."""
        for line in output.split('\n'):
            for cat_name, category in self.categories.items():
                for pattern in category.patterns:
                    if re.search(pattern, line):
                        self.errors[cat_name].append({
                            'message': line.strip(),
                            'severity': category.severity,
                            'pattern': pattern
                        })
                        break

    def generate_fixes(self):
        """Generate fixes for each error category."""
        for cat_name, errors in self.errors.items():
            category = self.categories[cat_name]

            if cat_name == 'model_registration':
                self.fixes[cat_name].extend(self._generate_model_fixes(errors))
            elif cat_name == 'route_errors':
                self.fixes[cat_name].extend(self._generate_route_fixes(errors))
            elif cat_name == 'async_errors':
                self.fixes[cat_name].extend(self._generate_async_fixes(errors))
            elif cat_name == 'config_errors':
                self.fixes[cat_name].extend(self._generate_config_fixes(errors))

    def _generate_model_fixes(self, errors: List[Dict]) -> List[Dict]:
        """Generate fixes for model registration errors."""
        fixes = []

        # Fix duplicate model registrations
        if any("Multiple classes found" in e['message'] for e in errors):
            fixes.append({
                'file': 'app/models/__init__.py',
                'description': "Update model imports to use fully qualified paths",
                'code': """
from backend.app.db.base import db
from backend.app.models.user import User  # Import each model directly
from backend.app.models.audio_file import AudioFile
# ... other model imports

__all__ = ['db', 'User', 'AudioFile']  # List all models
"""
            })

        # Fix missing table references
        if any("NoReferencedTableError" in e['message'] for e in errors):
            fixes.append({
                'file': 'app/db/base.py',
                'description': "Update base configuration",
                'code': """
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData

convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

metadata = MetaData(naming_convention=convention)
db = SQLAlchemy(metadata=metadata)
"""
            })

        return fixes

    def _generate_async_fixes(self, errors: List[Dict]) -> List[Dict]:
        """Generate fixes for async/event loop errors."""
        fixes = []

        if any("Working outside of application context" in e['message'] for e in errors):
            fixes.append({
                'file': 'tests/conftest.py',
                'description': "Fix Flask application context setup",
                'code': """
@pytest.fixture(scope="function")
def app():
    '''Create Flask app for testing.'''
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()
"""
            })

        return fixes

    def _generate_route_fixes(self, errors: List[Dict]) -> List[Dict]:
        """Generate fixes for route errors."""
        fixes = []

        if any("404 Not Found" in e['message'] for e in errors):
            fixes.append({
                'file': 'app/api/routes.py',
                'description': "Update Flask blueprint configuration",
                'code': """
from flask import Blueprint

auth_bp = Blueprint('auth', __name__)
users_bp = Blueprint('users', __name__)
audio_bp = Blueprint('audio', __name__)

# Register routes with blueprints
from backend.app.api.endpoints import auth, users, audio
"""
            })

        return fixes

    def _generate_config_fixes(self, errors: List[Dict]) -> List[Dict]:
        """Generate fixes for configuration errors."""
        fixes = []

        if any("assert '0.1.0' == '1.0.0'" in e['message'] for e in errors):
            fixes.append({
                'file': 'app/core/config.py',
                'description': "Update version and project settings",
                'code': """
class Config:
    PROJECT_NAME = "Harmonic Universe"
    VERSION = "1.0.0"
    API_PREFIX = "/api"

    # Flask-SQLAlchemy settings
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = "sqlite:///test.db"
"""
            })

        return fixes

    def generate_report(self) -> Dict:
        """Generate error analysis report."""
        return {
            'timestamp': datetime.now().isoformat(),
            'error_summary': {
                category: len(errors)
                for category, errors in self.errors.items()
            },
            'errors_by_category': dict(self.errors),
            'suggested_fixes': dict(self.fixes),
            'fix_order': [
                cat.name for cat in sorted(
                    self.categories.values(),
                    key=lambda x: x.severity
                )
            ]
        }

def main():
    """Run error analysis."""
    # Run pytest and capture output
    result = subprocess.run(
        ['pytest', '-v'],
        capture_output=True,
        text=True
    )

    # Analyze errors
    analyzer = ErrorAnalyzer()
    analyzer.analyze_pytest_output(result.stdout + result.stderr)

    # Generate fixes
    analyzer.generate_fixes()

    # Generate and save report
    report = analyzer.generate_report()

    Path('reports').mkdir(exist_ok=True)
    with open('reports/error_analysis.json', 'w') as f:
        json.dump(report, f, indent=2)

    print(f"Found {sum(len(e) for e in analyzer.errors.values())} errors")
    print("Error analysis saved to reports/error_analysis.json")

    # Print fix suggestions
    print("\nSuggested fixes (in order of priority):")
    for category in report['fix_order']:
        if category in analyzer.fixes:
            print(f"\n{category}:")
            for fix in analyzer.fixes[category]:
                print(f"- {fix['description']}")
                print(f"  File: {fix['file']}")

if __name__ == '__main__':
    main()
