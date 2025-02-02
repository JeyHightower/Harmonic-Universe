#!/usr/bin/env python3
import subprocess
import re
import json
from typing import Dict, List, Tuple
from datetime import datetime
import sys
import os
from contextlib import contextmanager

@contextmanager
def change_dir(new_dir):
    """Context manager for changing directory"""
    prev_dir = os.getcwd()
    os.chdir(new_dir)
    try:
        yield
    finally:
        os.chdir(prev_dir)

class TestAnalyzer:
    def __init__(self):
        self.error_patterns = {
            'assertion': r'AssertionError:.*',
            'import': r'ImportError:.*|ModuleNotFoundError:.*',
            'syntax': r'SyntaxError:.*',
            'attribute': r'AttributeError:.*',
            'type': r'TypeError:.*',
            'value': r'ValueError:.*',
            'fixture': r'fixture.*error.*',
            'collection': r'collection.*error.*',
            'file': r'([a-zA-Z0-9_\-/.]+\.py):.*'
        }

        self.error_counts: Dict[str, int] = {k: 0 for k in self.error_patterns.keys()}
        self.error_details: Dict[str, List[str]] = {k: [] for k in self.error_patterns.keys()}
        self.backend_dir = self._find_backend_dir()

    def _find_backend_dir(self) -> str:
        """Find the backend directory relative to the script location"""
        script_dir = os.path.dirname(os.path.abspath(__file__))
        if os.path.basename(script_dir) == 'backend':
            return script_dir
        parent_dir = os.path.dirname(script_dir)
        backend_dir = os.path.join(parent_dir, 'backend')
        if os.path.exists(backend_dir):
            return backend_dir
        return script_dir

    def run_tests(self) -> Tuple[str, int]:
        """Run pytest and capture output"""
        try:
            with change_dir(self.backend_dir):
                print(f"Running tests in: {os.getcwd()}")
                result = subprocess.run(
                    ['pytest', '-v', '--tb=short'],
                    capture_output=True,
                    text=True,
                    env={**os.environ, 'PYTHONPATH': self.backend_dir}
                )
                return result.stdout + result.stderr, result.returncode
        except Exception as e:
            return f"Error running tests: {str(e)}\nIn directory: {self.backend_dir}", 1

    def analyze_output(self, output: str) -> None:
        """Analyze pytest output and categorize errors"""
        print("\nAnalyzing test output...")

        # Store the full output for the report
        self.full_output = output

        for error_type, pattern in self.error_patterns.items():
            matches = re.finditer(pattern, output, re.MULTILINE | re.IGNORECASE)
            for match in matches:
                self.error_counts[error_type] += 1
                error_msg = match.group()
                if error_type != 'file':  # Don't duplicate file paths
                    self.error_details[error_type].append(error_msg)

    def generate_report(self) -> Dict:
        """Generate a detailed report of the analysis"""
        return {
            'timestamp': datetime.now().isoformat(),
            'test_directory': self.backend_dir,
            'summary': {
                'total_errors': sum(self.error_counts.values()),
                'error_counts': self.error_counts
            },
            'details': self.error_details,
            'full_output': self.full_output
        }

    def save_report(self, report: Dict, filename: str = 'test_analysis_report.json') -> None:
        """Save the analysis report to a file"""
        report_dir = os.path.join(self.backend_dir, 'reports')
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

        print("\nError Breakdown:")
        for error_type, count in report['summary']['error_counts'].items():
            if count > 0 and error_type != 'file':
                print(f"\n{error_type.title()} Errors: {count}")
                for detail in report['details'][error_type]:
                    print(f"  - {detail}")

def main():
    analyzer = TestAnalyzer()
    print("Starting test analysis...")

    output, return_code = analyzer.run_tests()
    analyzer.analyze_output(output)

    report = analyzer.generate_report()
    analyzer.print_report(report)
    analyzer.save_report(report)

    if return_code != 0:
        print("\nTests failed. See detailed report above.")
        sys.exit(1)
    else:
        print("\nAll tests passed!")
        sys.exit(0)

if __name__ == '__main__':
    main()
