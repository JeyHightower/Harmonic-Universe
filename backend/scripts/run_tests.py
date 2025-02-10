#!/usr/bin/env python3
"""Comprehensive test runner script."""

import argparse
import subprocess
import sys
import os
import json
from datetime import datetime
from typing import List, Dict, Any

def setup_test_environment() -> None:
    """Set up the test environment."""
    # Create test database
    subprocess.run(['python', 'scripts/init_db.py', '--env', 'test'], check=True)

    # Create test directories if they don't exist
    os.makedirs('uploads/test', exist_ok=True)
    os.makedirs('reports', exist_ok=True)

def run_tests(args: argparse.Namespace) -> Dict[str, Any]:
    """Run the tests based on provided arguments."""
    pytest_args = ['pytest']

    # Add coverage if requested
    if args.coverage:
        pytest_args.extend([
            '--cov=app',
            '--cov-report=html:reports/coverage_html',
            '--cov-report=xml:reports/coverage.xml'
        ])

    # Add verbosity
    if args.verbose:
        pytest_args.append('-v')

    # Add test selection if specified
    if args.test_path:
        pytest_args.append(args.test_path)

    # Add HTML report
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    report_path = f'reports/test_results_{timestamp}.html'
    pytest_args.extend(['--html', report_path])

    # Run the tests
    result = subprocess.run(pytest_args, capture_output=True, text=True)

    # Parse the results
    return {
        'exit_code': result.returncode,
        'output': result.stdout,
        'error': result.stderr,
        'report_path': report_path if args.coverage else None
    }

def analyze_results(results: Dict[str, Any]) -> None:
    """Analyze and save test results."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    # Save detailed results
    with open(f'reports/test_results_{timestamp}.json', 'w') as f:
        json.dump({
            'timestamp': timestamp,
            'exit_code': results['exit_code'],
            'output': results['output'],
            'error': results['error']
        }, f, indent=2)

    # Print summary
    print("\nTest Summary:")
    print("-" * 40)
    if results['exit_code'] == 0:
        print("✅ All tests passed!")
    else:
        print("❌ Some tests failed!")

    if results['report_path']:
        print(f"\nCoverage report available at: {results['report_path']}")

def cleanup_test_environment() -> None:
    """Clean up the test environment."""
    # Remove test uploads
    if os.path.exists('uploads/test'):
        for file in os.listdir('uploads/test'):
            os.remove(os.path.join('uploads/test', file))

    # Clean up old reports (keep last 10)
    report_dir = 'reports'
    if os.path.exists(report_dir):
        reports = sorted([
            f for f in os.listdir(report_dir)
            if f.startswith('test_results_')
        ], reverse=True)

        for old_report in reports[10:]:
            os.remove(os.path.join(report_dir, old_report))

def main() -> None:
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Run tests with various options')
    parser.add_argument('--coverage', action='store_true', help='Run with coverage report')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    parser.add_argument('--test-path', help='Specific test path to run')
    parser.add_argument('--skip-cleanup', action='store_true', help='Skip cleanup after tests')

    args = parser.parse_args()

    try:
        print("Setting up test environment...")
        setup_test_environment()

        print("\nRunning tests...")
        results = run_tests(args)

        print("\nAnalyzing results...")
        analyze_results(results)

        if not args.skip_cleanup:
            print("\nCleaning up test environment...")
            cleanup_test_environment()

        sys.exit(results['exit_code'])

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
