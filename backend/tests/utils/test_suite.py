#!/usr/bin/env python3
import subprocess
import re
import json
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import sys
import os
from dataclasses import dataclass
from enum import Enum
from contextlib import contextmanager
from pathlib import Path

class TestCategory(Enum):
    CORE = "core"
    MODEL = "model"
    API = "api"
    INTEGRATION = "integration"

class TestErrorType(Enum):
    ASSERTION = "assertion"
    IMPORT = "import"
    SYNTAX = "syntax"
    ATTRIBUTE = "attribute"
    TYPE = "type"
    VALUE = "value"
    FIXTURE = "fixture"
    COLLECTION = "collection"
    DATABASE = "database"
    UNKNOWN = "unknown"

@dataclass
class TestError:
    error_type: TestErrorType
    message: str
    file_path: Optional[str]
    line_number: Optional[int]
    full_traceback: str

@contextmanager
def change_dir(new_dir):
    """Context manager for changing directory"""
    prev_dir = os.getcwd()
    os.chdir(new_dir)
    try:
        yield
    finally:
        os.chdir(prev_dir)

class TestSuite:
    def __init__(self):
        self.error_patterns = {
            TestErrorType.ASSERTION: r'AssertionError:.*',
            TestErrorType.IMPORT: r'ImportError:.*|ModuleNotFoundError:.*',
            TestErrorType.SYNTAX: r'SyntaxError:.*',
            TestErrorType.ATTRIBUTE: r'AttributeError:.*',
            TestErrorType.TYPE: r'TypeError:.*',
            TestErrorType.VALUE: r'ValueError:.*',
            TestErrorType.FIXTURE: r'fixture.*error.*',
            TestErrorType.COLLECTION: r'collection.*error.*',
            TestErrorType.DATABASE: r'(OperationalError|IntegrityError|DatabaseError):.*'
        }

        self.error_counts: Dict[TestErrorType, int] = {k: 0 for k in TestErrorType}
        self.error_details: Dict[TestErrorType, List[TestError]] = {k: [] for k in TestErrorType}
        self.backend_dir = self._find_backend_dir()
        self.full_output = ""

        # Test category ordering
        self.test_order = [
            TestCategory.CORE,
            TestCategory.MODEL,
            TestCategory.API,
            TestCategory.INTEGRATION
        ]

    def _find_backend_dir(self) -> str:
        """Find the backend directory relative to the script location"""
        script_dir = os.path.dirname(os.path.abspath(__file__))

        # If we're already in the backend directory
        if os.path.basename(script_dir) == 'backend':
            return script_dir

        # If we're in backend/utils
        if os.path.basename(os.path.dirname(script_dir)) == 'backend':
            return os.path.dirname(script_dir)

        # Try to find backend in parent directory
        parent_dir = os.path.dirname(script_dir)
        backend_dir = os.path.join(parent_dir, 'backend')
        if os.path.exists(backend_dir):
            return backend_dir

        # If all else fails, use current directory
        print("Warning: Could not locate backend directory. Using current directory.")
        return os.getcwd()

    def _parse_error_location(self, error_text: str) -> Tuple[Optional[str], Optional[int]]:
        """Extract file path and line number from error text"""
        file_pattern = r'File "([^"]+)", line (\d+)'
        match = re.search(file_pattern, error_text)
        if match:
            return match.group(1), int(match.group(2))
        return None, None

    def run_category_tests(self, category: TestCategory) -> Tuple[str, int]:
        """Run tests for a specific category"""
        try:
            with change_dir(self.backend_dir):
                test_dir = os.path.join('tests', category.value)
                if not os.path.exists(test_dir):
                    print(f"Warning: Test directory not found: {test_dir}")
                    return f"Error: Test directory not found: {test_dir}", 1

                print(f"\nRunning {category.value} tests...")
                result = subprocess.run(
                    ['pytest', '-v', '--tb=short', test_dir],
                    capture_output=True,
                    text=True,
                    env={**os.environ, 'PYTHONPATH': self.backend_dir}
                )

                return result.stdout + result.stderr, result.returncode
        except Exception as e:
            error_msg = f"Error running {category.value} tests: {str(e)}"
            print(error_msg)
            return error_msg, 1

    def run_tests(self) -> Tuple[str, int]:
        """Run all tests in the correct order"""
        combined_output = ""
        final_return_code = 0

        for category in self.test_order:
            output, return_code = self.run_category_tests(category)
            combined_output += f"\n=== {category.value.upper()} TESTS ===\n{output}"
            if return_code != 0:
                final_return_code = return_code

        self.full_output = combined_output
        return combined_output, final_return_code

    def analyze_output(self, output: str) -> None:
        """Analyze pytest output and categorize errors"""
        print("\nAnalyzing test output...")
        self.full_output = output

        # Reset error counts
        self.error_counts = {k: 0 for k in TestErrorType}
        self.error_details = {k: [] for k in TestErrorType}

        # Check for collection errors first
        if "collected 0 items" in output:
            self.error_counts[TestErrorType.COLLECTION] += 1
            self.error_details[TestErrorType.COLLECTION].append(
                TestError(
                    error_type=TestErrorType.COLLECTION,
                    message="No tests were collected. Check your test discovery settings.",
                    file_path=None,
                    line_number=None,
                    full_traceback=output
                )
            )
            return

        for error_type, pattern in self.error_patterns.items():
            matches = re.finditer(pattern, output, re.MULTILINE | re.IGNORECASE)
            for match in matches:
                self.error_counts[error_type] += 1
                error_msg = match.group()
                file_path, line_number = self._parse_error_location(output[match.start()-200:match.end()+200])

                error = TestError(
                    error_type=error_type,
                    message=error_msg,
                    file_path=file_path,
                    line_number=line_number,
                    full_traceback=output[match.start()-200:match.end()+200].strip()
                )
                self.error_details[error_type].append(error)

    def generate_report(self) -> Dict:
        """Generate a detailed report of the analysis"""
        error_details_dict = {}
        for error_type, errors in self.error_details.items():
            error_details_dict[error_type.value] = [
                {
                    'message': error.message,
                    'file_path': error.file_path,
                    'line_number': error.line_number,
                    'full_traceback': error.full_traceback
                }
                for error in errors
            ]

        return {
            'timestamp': datetime.now().isoformat(),
            'test_directory': self.backend_dir,
            'summary': {
                'total_errors': sum(self.error_counts.values()),
                'error_counts': {k.value: v for k, v in self.error_counts.items()}
            },
            'details': error_details_dict,
            'full_output': self.full_output
        }

    def save_report(self, report: Dict, filename: str = 'test_analysis_report.json') -> None:
        """Save the analysis report to a file"""
        report_dir = os.path.join(self.backend_dir, 'tests', 'reports')
        os.makedirs(report_dir, exist_ok=True)
        report_path = os.path.join(report_dir, filename)

        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"\nReport saved to: {report_path}")

    def print_report(self, report: Dict) -> None:
        """Print a formatted version of the report to console"""
        print("\n=== Test Analysis Report ===")
        print(f"Timestamp: {report['timestamp']}")
        print(f"Test Directory: {report['test_directory']}")
        print(f"\nTotal Errors: {report['summary']['total_errors']}")

        if report['summary']['total_errors'] == 0:
            if "collected 0 items" in report['full_output']:
                print("\nWarning: No tests were collected!")
                print("Possible reasons:")
                print("1. No test files found")
                print("2. Test files don't match naming pattern (should start with 'test_')")
                print("3. Test functions don't match pattern (should start with 'test_')")
            elif "no tests ran" in report['full_output'].lower():
                print("\nWarning: No tests were executed!")
            elif report.get('full_output', '').strip():
                print("\nTests were discovered but may have failed silently.")
                print("Check the full pytest output above for details.")

        print("\nError Breakdown by Category:")
        for category in TestCategory:
            category_errors = [
                error for error_type, errors in report['details'].items()
                for error in errors
                if error.get('file_path', '').startswith(f"tests/{category.value}")
            ]
            if category_errors:
                print(f"\n{category.value.upper()} Test Errors:")
                for error in category_errors:
                    if error['file_path']:
                        print(f"  File: {error['file_path']}:{error['line_number']}")
                    print(f"  Message: {error['message']}")
                    print("  ---")

def main():
    suite = TestSuite()
    print("Starting test analysis...")

    output, return_code = suite.run_tests()
    suite.analyze_output(output)

    report = suite.generate_report()
    suite.print_report(report)
    suite.save_report(report)

    if return_code != 0:
        print("\nTests failed. See detailed report above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
