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
                description="FastAPI route and HTTP method issues",
                fix_function="fix_route_errors"
            ),
            'async_errors': ErrorCategory(
                name="Async/Event Loop",
                severity=3,
                patterns=[
                    r"_UnixSelectorEventLoop.*?_signal_handlers",
                    r"changelist must be an iterable",
                    r"ScopeMismatch"
                ],
                description="Async test configuration and event loop issues",
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
from app.db.base import Base
from app.models.user import User  # Import each model directly
from app.models.audio_file import AudioFile
# ... other model imports

__all__ = ['Base', 'User', 'AudioFile']  # List all models
"""
            })

        # Fix missing table references
        if any("NoReferencedTableError" in e['message'] for e in errors):
            fixes.append({
                'file': 'app/db/base.py',
                'description': "Update base configuration",
                'code': """
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import MetaData

convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

metadata = MetaData(naming_convention=convention)
Base = declarative_base(metadata=metadata)
"""
            })

        return fixes

    def _generate_async_fixes(self, errors: List[Dict]) -> List[Dict]:
        """Generate fixes for async/event loop errors."""
        fixes = []

        if any("_UnixSelectorEventLoop" in e['message'] for e in errors):
            fixes.append({
                'file': 'tests/conftest.py',
                'description': "Fix event loop setup",
                'code': """
@pytest.fixture(scope="session")
def event_loop():
    \"\"\"Create event loop for tests.\"\"\"
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    with contextlib.suppress(Exception):
        loop.close()
"""
            })

        return fixes

    def _generate_route_fixes(self, errors: List[Dict]) -> List[Dict]:
        """Generate fixes for route errors."""
        fixes = []

        if any("404 Not Found" in e['message'] for e in errors):
            fixes.append({
                'file': 'app/api/v1/api.py',
                'description': "Update API router configuration",
                'code': """
from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, audio

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(audio.router, prefix="/audio", tags=["audio"])
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
class Settings:
    PROJECT_NAME: str = "Harmonic Universe"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
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
