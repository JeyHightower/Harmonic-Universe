"""Test reporting fixtures."""

import pytest
from typing import Dict, Any, Callable, List
from datetime import datetime
import json
from pathlib import Path

@pytest.fixture
def test_report_generator() -> Callable[..., Dict[str, Any]]:
    """Get a function that generates test reports."""
    def _generate(
        test_name: str,
        status: str,
        duration: float,
        error: str = None,
        **kwargs
    ) -> Dict[str, Any]:
        return {
            "test_name": test_name,
            "status": status,
            "duration": duration,
            "timestamp": datetime.utcnow().isoformat(),
            "error": error,
            "metadata": kwargs
        }
    return _generate

@pytest.fixture
def test_suite_report_generator() -> Callable[..., Dict[str, Any]]:
    """Get a function that generates test suite reports."""
    def _generate(
        suite_name: str,
        test_results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        total_tests = len(test_results)
        passed_tests = sum(1 for t in test_results if t["status"] == "passed")
        failed_tests = sum(1 for t in test_results if t["status"] == "failed")
        skipped_tests = sum(1 for t in test_results if t["status"] == "skipped")
        total_duration = sum(t["duration"] for t in test_results)

        return {
            "suite_name": suite_name,
            "timestamp": datetime.utcnow().isoformat(),
            "summary": {
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "failed_tests": failed_tests,
                "skipped_tests": skipped_tests,
                "success_rate": passed_tests / total_tests if total_tests > 0 else 0,
                "total_duration": total_duration
            },
            "test_results": test_results
        }
    return _generate

@pytest.fixture
def test_report_writer() -> Callable[[Dict[str, Any], Path], None]:
    """Get a function that writes test reports to files."""
    def _write_report(report: Dict[str, Any], output_path: Path) -> None:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w") as f:
            json.dump(report, f, indent=2)
    return _write_report

@pytest.fixture
def test_report_analyzer() -> Callable[[Dict[str, Any]], Dict[str, Any]]:
    """Get a function that analyzes test reports."""
    def _analyze(report: Dict[str, Any]) -> Dict[str, Any]:
        summary = report["summary"]
        test_results = report["test_results"]

        # Calculate timing statistics
        durations = [t["duration"] for t in test_results]
        avg_duration = sum(durations) / len(durations) if durations else 0
        max_duration = max(durations) if durations else 0
        min_duration = min(durations) if durations else 0

        # Group failures by error type
        failures = {}
        for test in test_results:
            if test["status"] == "failed" and test.get("error"):
                error_type = test["error"].split(":")[0]
                failures.setdefault(error_type, []).append(test)

        return {
            "timing_stats": {
                "average_duration": avg_duration,
                "max_duration": max_duration,
                "min_duration": min_duration,
                "total_duration": summary["total_duration"]
            },
            "failure_analysis": {
                "total_failures": summary["failed_tests"],
                "failure_types": {
                    error_type: len(tests)
                    for error_type, tests in failures.items()
                },
                "detailed_failures": failures
            },
            "success_metrics": {
                "success_rate": summary["success_rate"],
                "total_tests": summary["total_tests"],
                "passed_tests": summary["passed_tests"],
                "skipped_tests": summary["skipped_tests"]
            }
        }
    return _analyze
