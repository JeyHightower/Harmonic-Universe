#!/usr/bin/env python3
"""Test runner script for executing tests in the correct order."""

import subprocess
import sys
import json
from pathlib import Path
from typing import List, Tuple, Dict, Any
from datetime import datetime

class TestCategory:
    CORE = "core"
    MODELS = "models"
    API = "api"
    INTEGRATION = "integration"

    @classmethod
    def get_order(cls) -> List[str]:
        """Get the test execution order."""
        return [cls.CORE, cls.MODELS, cls.API, cls.INTEGRATION]

def run_test_category(category: str, test_path: Path) -> Tuple[int, str, float]:
    """Run tests for a specific category."""
    print(f"\n=== Running {category} Tests ===")

    if not test_path.exists():
        print(f"Warning: Test directory {test_path} not found")
        return 1, f"Test directory {test_path} not found", 0.0

    start_time = datetime.now()
    result = subprocess.run(
        [
            'pytest',
            '-v',
            '--tb=short',
            '--cov=app',
            '--cov-report=term-missing',
            str(test_path)
        ],
        capture_output=True,
        text=True
    )
    duration = (datetime.now() - start_time).total_seconds()

    print(result.stdout)
    if result.stderr:
        print("Errors:", result.stderr)

    return result.returncode, result.stdout + result.stderr, duration

def generate_test_report(
    category: str,
    output: str,
    duration: float,
    returncode: int
) -> Dict[str, Any]:
    """Generate a test report for a category."""
    # Parse test results
    passed = output.count("PASSED")
    failed = output.count("FAILED")
    skipped = output.count("SKIPPED")
    errors = output.count("ERROR")

    # Extract coverage information
    coverage_lines = [
        line for line in output.split('\n')
        if "TOTAL" in line and "%" in line
    ]
    coverage = coverage_lines[0] if coverage_lines else "No coverage data"

    return {
        "category": category,
        "timestamp": datetime.now().isoformat(),
        "duration": duration,
        "results": {
            "passed": passed,
            "failed": failed,
            "skipped": skipped,
            "errors": errors,
            "total": passed + failed + skipped + errors
        },
        "coverage": coverage,
        "returncode": returncode,
        "output": output
    }

def save_test_report(report: Dict[str, Any], reports_dir: Path) -> None:
    """Save test report to file."""
    reports_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_file = reports_dir / f"test_results_{timestamp}.json"

    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    print(f"\nTest report saved to: {report_file}")

def main():
    """Main test runner function."""
    # Get the backend directory
    backend_dir = Path(__file__).parent.parent
    tests_dir = backend_dir / 'tests'
    reports_dir = backend_dir / 'reports'

    # Test categories in order
    categories = [
        (category, tests_dir / category)
        for category in TestCategory.get_order()
    ]

    failed_categories: List[str] = []
    all_reports: List[Dict[str, Any]] = []
    total_duration = 0.0

    # Run each category
    for category_name, category_path in categories:
        returncode, output, duration = run_test_category(category_name, category_path)
        total_duration += duration

        # Generate and store report
        report = generate_test_report(
            category_name,
            output,
            duration,
            returncode
        )
        all_reports.append(report)

        if returncode != 0:
            failed_categories.append(category_name)

    # Generate final report
    final_report = {
        "timestamp": datetime.now().isoformat(),
        "total_duration": total_duration,
        "failed_categories": failed_categories,
        "category_reports": all_reports
    }

    # Save report
    save_test_report(final_report, reports_dir)

    # Print summary
    print("\n=== Test Summary ===")
    print(f"Total Duration: {total_duration:.2f} seconds")
    if failed_categories:
        print(f"Failed categories: {', '.join(failed_categories)}")
        sys.exit(1)
    else:
        print("All test categories passed!")
        sys.exit(0)

if __name__ == '__main__':
    main()
