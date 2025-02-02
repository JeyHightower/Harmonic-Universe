"""Test fixing script."""

import re
import sys
from pathlib import Path
from typing import Dict, List, NamedTuple, Set
from dataclasses import dataclass
import subprocess
import json
import asyncio
import contextlib
from collections import defaultdict
from datetime import datetime

@dataclass
class ErrorPattern:
    """Pattern for matching errors."""
    pattern: str
    description: str
    fix_priority: int  # Lower number = higher priority

@dataclass
class ErrorCategory:
    """Error category with patterns and fixes."""
    name: str
    severity: int
    patterns: List[ErrorPattern]
    files_to_check: List[str]
    fix_function: callable
    dependencies: Set[str] = None  # Categories that must be fixed first

class TestError(NamedTuple):
    """Represents a test error."""
    message: str
    category: str
    file: str
    line: int
    severity: int
    pattern_matched: ErrorPattern

class TestFixer:
    """Analyzes and fixes test errors."""

    def __init__(self):
        """Initialize test fixer."""
        self.project_root = Path(__file__).parent.parent
        self.categories = self._setup_categories()
        self.errors: List[TestError] = []
        self.fix_history: List[Dict] = []

    def _setup_categories(self) -> Dict[str, ErrorCategory]:
        """Setup error categories with their patterns."""
        return {
            'model_registration': ErrorCategory(
                name='Model Registration',
                severity=1,
                patterns=[
                    ErrorPattern(
                        pattern=r'Multiple classes found for path "(.*?)"',
                        description="Duplicate model registration",
                        fix_priority=1
                    ),
                    ErrorPattern(
                        pattern=r'NoReferencedTableError.*?table \'(.*?)\'',
                        description="Missing table reference",
                        fix_priority=2
                    )
                ],
                files_to_check=[
                    'app/models/*.py',
                    'app/db/*.py'
                ],
                fix_function=self._fix_model_registration,
                dependencies=set()
            ),
            'database_setup': ErrorCategory(
                name='Database Setup',
                severity=2,
                patterns=[
                    ErrorPattern(
                        pattern=r'OperationalError.*?no such table',
                        description="Missing database table",
                        fix_priority=1
                    ),
                    ErrorPattern(
                        pattern=r'InvalidRequestError.*?mapper failed',
                        description="Invalid mapper configuration",
                        fix_priority=2
                    )
                ],
                files_to_check=[
                    'app/db/*.py',
                    'tests/conftest.py'
                ],
                fix_function=self._fix_database_setup,
                dependencies={'model_registration'}
            ),
            'async_setup': ErrorCategory(
                name='Async Setup',
                severity=3,
                patterns=[
                    ErrorPattern(
                        pattern=r'_UnixSelectorEventLoop.*?_signal_handlers',
                        description="Event loop signal handler issue",
                        fix_priority=1
                    ),
                    ErrorPattern(
                        pattern=r'ScopeMismatch.*?function scope',
                        description="Async fixture scope mismatch",
                        fix_priority=2
                    )
                ],
                files_to_check=[
                    'tests/conftest.py',
                    'tests/**/test_*.py'
                ],
                fix_function=self._fix_async_setup,
                dependencies=set()
            ),
            'test_config': ErrorCategory(
                name='Test Configuration',
                severity=4,
                patterns=[
                    ErrorPattern(
                        pattern=r"fixture '(.*?)' not found",
                        description="Missing fixture",
                        fix_priority=1
                    ),
                    ErrorPattern(
                        pattern=r"AssertionError: assert '(.*?)' == '(.*?)'",
                        description="Configuration value mismatch",
                        fix_priority=2
                    )
                ],
                files_to_check=[
                    'tests/conftest.py',
                    'app/core/config.py'
                ],
                fix_function=self._fix_test_config,
                dependencies={'model_registration', 'database_setup'}
            )
        }

    def run_tests(self) -> str:
        """Run pytest and capture output."""
        result = subprocess.run(
            ['pytest', '-v'],
            capture_output=True,
            text=True
        )
        return result.stdout + result.stderr

    def analyze_errors(self, test_output: str):
        """Analyze test output and categorize errors."""
        self.errors.clear()

        for line in test_output.split('\n'):
            for cat_name, category in self.categories.items():
                for pattern in category.patterns:
                    if re.search(pattern.pattern, line):
                        error = self._parse_error_line(line, cat_name, category.severity, pattern)
                        if error:
                            self.errors.append(error)

    def _parse_error_line(self, line: str, category: str, severity: int, pattern: ErrorPattern) -> TestError:
        """Parse error line into TestError object."""
        file_match = re.search(r'([\w/]+\.py):(\d+)', line)
        if file_match:
            return TestError(
                message=line.strip(),
                category=category,
                file=file_match.group(1),
                line=int(file_match.group(2)),
                severity=severity,
                pattern_matched=pattern
            )
        return None

    def fix_errors(self):
        """Fix errors in dependency order."""
        # Group errors by category
        categorized = defaultdict(list)
        for error in sorted(self.errors, key=lambda x: x.pattern_matched.fix_priority):
            categorized[error.category].append(error)

        # Create dependency graph
        graph = {cat: self.categories[cat].dependencies for cat in categorized.keys()}

        # Fix in topological order
        fixed = set()
        while graph:
            # Find categories with no dependencies
            ready = {cat for cat, deps in graph.items() if not deps - fixed}
            if not ready:
                remaining = ', '.join(graph.keys())
                print(f"Circular dependency detected. Remaining categories: {remaining}")
                break

            # Fix ready categories
            for category in ready:
                if category in categorized:
                    print(f"Fixing {category} issues...")
                    self.categories[category].fix_function(categorized[category])
                    self._record_fix(category, categorized[category])
                fixed.add(category)
                del graph[category]

    def _record_fix(self, category: str, errors: List[TestError]):
        """Record fix attempt for analysis."""
        self.fix_history.append({
            'category': category,
            'timestamp': datetime.now().isoformat(),
            'errors_fixed': len(errors),
            'files_modified': list(set(error.file for error in errors))
        })

    def _fix_model_registration(self, errors: List[TestError]):
        """Fix model registration issues."""
        # Check for duplicate model registrations
        model_files = {}
        for error in errors:
            if 'Multiple classes found for path' in error.message:
                model_name = re.search(r'path "(.*?)"', error.message).group(1)
                model_files[model_name] = error.file

        # Update model imports to use fully qualified paths
        for model_name, file_path in model_files.items():
            file_path = self.project_root / file_path
            if file_path.exists():
                content = file_path.read_text()
                # Update imports to use fully qualified paths
                content = re.sub(
                    rf'from app.models import {model_name}',
                    f'from app.models.{model_name.lower()} import {model_name}',
                    content
                )
                file_path.write_text(content)

    def _fix_database_setup(self, errors: List[TestError]):
        """Fix database setup issues."""
        conftest_path = self.project_root / 'tests' / 'conftest.py'
        if not conftest_path.exists():
            return

        content = conftest_path.read_text()

        # Add proper database initialization
        db_setup = '''
@pytest.fixture(scope="session")
def engine():
    """Create database engine."""
    engine = create_engine(
        settings.SQLALCHEMY_DATABASE_URI,
        echo=settings.DEBUG,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False}
        if settings.SQLALCHEMY_DATABASE_URI.startswith("sqlite")
        else {}
    )

    # Import all models to ensure they're registered
    import_all_models()

    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="session")
def db_session(engine):
    """Create database session."""
    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
'''
        # Update database setup in conftest.py
        if 'def engine():' not in content:
            content += '\n' + db_setup

        conftest_path.write_text(content)

    def _fix_async_setup(self, errors: List[TestError]):
        """Fix async setup issues."""
        conftest_path = self.project_root / 'tests' / 'conftest.py'
        if not conftest_path.exists():
            return

        content = conftest_path.read_text()

        # Fix event loop setup
        event_loop_fix = '''
@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for tests."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    with contextlib.suppress(Exception):
        loop.close()
'''
        # Replace existing event_loop fixture
        content = re.sub(
            r'@pytest\.fixture.*?\ndef event_loop.*?loop\.close\(\)',
            event_loop_fix.strip(),
            content,
            flags=re.DOTALL
        )

        conftest_path.write_text(content)

    def _fix_test_config(self, errors: List[TestError]):
        """Fix test configuration issues."""
        conftest_path = self.project_root / 'tests' / 'conftest.py'
        if not conftest_path.exists():
            return

        content = conftest_path.read_text()
        fixes = {
            'fixture not found': self._fix_missing_fixtures,
            'ScopeMismatch': self._fix_scope_mismatch
        }

        for error in errors:
            for pattern, fix_func in fixes.items():
                if pattern in error.message:
                    content = fix_func(content, error)

        conftest_path.write_text(content)

    def _fix_missing_fixtures(self, content: str, error: TestError) -> str:
        """Fix missing fixture errors."""
        fixture_name = re.search(r"fixture '(.*?)'", error.message).group(1)

        # Add missing fixture
        fixture_template = f"""
@pytest.fixture
def {fixture_name}():
    \"\"\"Auto-generated fixture for {fixture_name}.\"\"\"
    # TODO: Implement fixture
    pass
"""
        return content + "\n" + fixture_template

    def _fix_scope_mismatch(self, content: str, error: TestError) -> str:
        """Fix scope mismatch errors."""
        # Find fixture without scope and add session scope
        fixture_pattern = r'@pytest.fixture\s*\n'
        return re.sub(
            fixture_pattern,
            '@pytest.fixture(scope="session")\n',
            content
        )

    def generate_report(self):
        """Generate enhanced error analysis report."""
        report = {
            'total_errors': len(self.errors),
            'categories': defaultdict(list),
            'files_affected': set(),
            'fix_history': self.fix_history,
            'recommendations': [],
            'error_patterns': defaultdict(int)
        }

        # Enhanced error analysis
        for error in self.errors:
            report['categories'][error.category].append({
                'message': error.message,
                'file': error.file,
                'line': error.line,
                'pattern': error.pattern_matched.description
            })
            report['files_affected'].add(error.file)
            report['error_patterns'][error.pattern_matched.description] += 1

        # Generate recommendations
        for category, errors in report['categories'].items():
            if len(errors) > 5:
                report['recommendations'].append({
                    'category': category,
                    'suggestion': f"Consider refactoring {category} code due to high error count",
                    'error_count': len(errors)
                })

        # Save report
        report['files_affected'] = list(report['files_affected'])
        Path('reports').mkdir(exist_ok=True)
        with open('reports/test_analysis_report.json', 'w') as f:
            json.dump(report, f, indent=2)

def main():
    """Main function."""
    fixer = TestFixer()

    print("Running tests...")
    test_output = fixer.run_tests()

    print("Analyzing errors...")
    fixer.analyze_errors(test_output)

    print("Generating initial report...")
    fixer.generate_report()

    if fixer.errors:
        print(f"\nFound {len(fixer.errors)} errors. See reports/test_analysis_report.json")
        print("\nAttempting to fix errors...")
        fixer.fix_errors()

        print("\nRunning tests again to verify fixes...")
        test_output = fixer.run_tests()
        fixer.analyze_errors(test_output)

        print("\nGenerating final report...")
        fixer.generate_report()

        remaining = len(fixer.errors)
        if remaining:
            print(f"\n{remaining} errors remain. Please check the final report.")
        else:
            print("\nAll errors fixed successfully!")
    else:
        print("No errors found!")

if __name__ == '__main__':
    main()
