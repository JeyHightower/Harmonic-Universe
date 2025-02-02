from typing import Dict, List, Optional, Tuple
import re
import subprocess
from pathlib import Path
from dataclasses import dataclass
from enum import Enum
import sys
import os

# Add the backend directory to the Python path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.append(backend_dir)

from utils.test_suite import TestSuite, TestError, TestErrorType

class ErrorType(Enum):
    DATABASE = "database"
    IMPORT = "import"
    ASSERTION = "assertion"
    SYNTAX = "syntax"
    UNKNOWN = "unknown"

@dataclass
class TestError:
    error_type: ErrorType
    message: str
    file_path: Optional[str]
    line_number: Optional[int]
    full_traceback: str

class ErrorParser:
    """Parses pytest output to extract error information."""

    @staticmethod
    def parse_pytest_output(output: str) -> List[TestError]:
        errors = []
        error_blocks = re.split(r'_{3,}', output)

        for block in error_blocks:
            if not block.strip():
                continue

            error_type = ErrorParser._determine_error_type(block)
            message = ErrorParser._extract_error_message(block)
            file_path, line_number = ErrorParser._extract_location(block)

            errors.append(TestError(
                error_type=error_type,
                message=message,
                file_path=file_path,
                line_number=line_number,
                full_traceback=block.strip()
            ))

        return errors

    @staticmethod
    def _determine_error_type(error_block: str) -> ErrorType:
        if any(db_error in error_block.lower() for db_error in
              ['sqlalchemy', 'database', 'db', 'postgresql']):
            return ErrorType.DATABASE
        elif 'importerror' in error_block.lower():
            return ErrorType.IMPORT
        elif 'assertionerror' in error_block.lower():
            return ErrorType.ASSERTION
        elif 'syntaxerror' in error_block.lower():
            return ErrorType.SYNTAX
        return ErrorType.UNKNOWN

    @staticmethod
    def _extract_error_message(error_block: str) -> str:
        # Try to find the actual error message after the error class name
        match = re.search(r'Error: (.*?)(?:\n|$)', error_block)
        if match:
            return match.group(1).strip()
        return "Unknown error message"

    @staticmethod
    def _extract_location(error_block: str) -> Tuple[Optional[str], Optional[int]]:
        # Look for file paths and line numbers in the error block
        match = re.search(r'File "(.*?)", line (\d+)', error_block)
        if match:
            return match.group(1), int(match.group(2))
        return None, None

class SolutionProvider:
    """Provides solutions for common test errors."""

    _COMMON_SOLUTIONS = {
        ErrorType.DATABASE: {
            "NoReferencedTableError": [
                "Ensure all referenced tables are created before running tests",
                "Check if table names in foreign keys match exactly",
                "Verify database migrations are up to date",
                "Run `alembic upgrade head` to apply all migrations"
            ],
            "OperationalError": [
                "Verify database connection settings",
                "Ensure database server is running",
                "Check if database exists and user has proper permissions"
            ]
        },
        ErrorType.IMPORT: [
            "Verify the module exists in your project",
            "Check if all dependencies are installed",
            "Ensure virtual environment is activated",
            "Run `pip install -r requirements.txt`"
        ],
        ErrorType.ASSERTION: [
            "Review test expectations vs actual results",
            "Check if test data setup is correct",
            "Verify if recent code changes affected the test"
        ],
        ErrorType.SYNTAX: [
            "Check for proper indentation",
            "Verify all parentheses and brackets are closed",
            "Ensure proper Python syntax is used"
        ]
    }

    @classmethod
    def get_solutions(cls, error: TestError) -> List[str]:
        """Get potential solutions for a given error."""
        if error.error_type in cls._COMMON_SOLUTIONS:
            solutions = []

            # Try to match specific error patterns
            for error_pattern, specific_solutions in cls._COMMON_SOLUTIONS[error.error_type].items():
                if isinstance(specific_solutions, list) and error_pattern.lower() in error.message.lower():
                    solutions.extend(specific_solutions)

            # If no specific solutions found, return general solutions for the error type
            if not solutions and isinstance(cls._COMMON_SOLUTIONS[error.error_type], list):
                solutions = cls._COMMON_SOLUTIONS[error.error_type]

            return solutions or ["No specific solution found for this error"]
        return ["Unknown error type"]

def process_test_output(pytest_output: str) -> Dict:
    """
    Process pytest output and provide structured error information with solutions.

    Args:
        pytest_output: Raw output from pytest execution

    Returns:
        Dict containing parsed errors and their solutions
    """
    parser = ErrorParser()
    errors = parser.parse_pytest_output(pytest_output)

    result = {
        "total_errors": len(errors),
        "errors": []
    }

    for error in errors:
        solutions = SolutionProvider.get_solutions(error)
        result["errors"].append({
            "type": error.error_type.value,
            "message": error.message,
            "file": error.file_path,
            "line": error.line_number,
            "solutions": solutions
        })

    return result

def run_tests_with_helper() -> int:
    """
    Legacy wrapper for the TestSuite functionality.
    Maintained for backward compatibility.
    """
    suite = TestSuite()
    print("Starting test analysis using combined test suite...")

    output, return_code = suite.run_tests()
    suite.analyze_output(output)

    report = suite.generate_report()
    suite.print_report(report)
    suite.save_report(report)

    return return_code

if __name__ == "__main__":
    exit(run_tests_with_helper())
