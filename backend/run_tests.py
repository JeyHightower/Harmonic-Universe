import os
import sys
import pytest
import json
import importlib
from datetime import datetime
from typing import Dict, List, Any, Tuple
import asyncio
import platform
import nest_asyncio

class TestRunner:
    def __init__(self):
        self.test_dir = "tests"
        self.report_dir = "reports"
        self.categories = {
            "unit": ["unit/"],
            "api": ["api/", "test_api"],
            "basic": ["test_basic", "test_config", "test_db"],
            "analysis": ["test_analyzer", "test_analysis", "test_monitoring"],
            "websocket": ["test_websocket"],
            "integration": ["integration/"],
            "e2e": ["e2e/"]
        }
        self.required_packages = [
            ("flask", "flask"),
            ("flask_jwt_extended", "flask-jwt-extended"),
            ("flask_marshmallow", "flask-marshmallow"),
            ("flask_socketio", "flask-socketio"),
            ("marshmallow_sqlalchemy", "marshmallow-sqlalchemy"),
            ("pytest", "pytest"),
            ("sqlalchemy", "sqlalchemy"),
            ("alembic", "alembic"),
            ("aiohttp", "aiohttp"),
            ("websockets", "websockets"),
            ("eventlet", "eventlet")
        ]
        self.results: Dict[str, Any] = {
            "metadata": {
                "timestamp": datetime.now().isoformat(),
                "platform": platform.system(),
                "python_version": sys.version
            },
            "results": {}
        }

    def verify_dependencies(self) -> Tuple[bool, List[str]]:
        """Verify all required packages are installed"""
        missing_packages = []
        for import_name, package_name in self.required_packages:
            try:
                importlib.import_module(import_name)
            except ImportError:
                missing_packages.append(package_name)
        return len(missing_packages) == 0, missing_packages

    def setup_test_environment(self):
        """Set up test environment variables and configurations"""
        # Verify dependencies first
        deps_ok, missing = self.verify_dependencies()
        if not deps_ok:
            print(f"\nERROR: Missing required packages: {', '.join(missing)}")
            print("Please run: pip install -r requirements.txt")
            sys.exit(1)

        # Set environment variables
        os.environ["TESTING"] = "1"
        os.environ["FLASK_ENV"] = "testing"
        os.environ["DATABASE_URL"] = "sqlite:///./test.db"
        os.environ["JWT_SECRET_KEY"] = "test-secret-key"
        os.environ["SECRET_KEY"] = "test-secret-key"

        # Ensure report directory exists
        if not os.path.exists(self.report_dir):
            os.makedirs(self.report_dir)

        # Add backend directory to Python path
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        if backend_dir not in sys.path:
            sys.path.insert(0, backend_dir)

        # Initialize event loop for async tests
        if platform.system() == "Windows":
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        else:
            try:
                import uvloop
                asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
            except ImportError:
                pass

        # Allow nested event loops
        try:
            nest_asyncio.apply()
        except Exception as e:
            print(f"Warning: Could not apply nest_asyncio: {e}")

    def find_test_files(self, patterns: List[str]) -> List[str]:
        """Find test files matching the given patterns"""
        test_files = []
        for pattern in patterns:
            if pattern.endswith('/'):
                # Directory pattern
                dir_path = os.path.join(self.test_dir, pattern)
                if os.path.exists(dir_path):
                    for root, _, files in os.walk(dir_path):
                        for file in files:
                            if file.startswith('test_') and file.endswith('.py'):
                                test_files.append(os.path.join(root, file))
            else:
                # File pattern
                pattern_with_py = f"{pattern}.py" if not pattern.endswith('.py') else pattern
                file_path = os.path.join(self.test_dir, pattern_with_py)
                if os.path.exists(file_path):
                    test_files.append(file_path)
        return test_files

    def run_category_tests(self, category: str, test_paths: List[str]) -> Dict:
        """Run tests for a specific category"""
        print(f"\nRunning {category} tests...")

        test_files = self.find_test_files(test_paths)
        if not test_files:
            print(f"Warning: No test files found for category '{category}'")
            return {
                "exit_code": 0,
                "status": "skipped",
                "timestamp": datetime.now().isoformat(),
                "message": "No test files found"
            }

        args = [
            "-v",
            "--tb=short",
            "-p", "no:warnings",
            "--capture=no",  # Show print statements during tests
        ]

        # Add async-specific arguments for websocket tests
        if category == "websocket":
            args.extend([
                "--asyncio-mode=auto",
                "-k", "not test_websocket_stress"  # Skip stress tests by default
            ])

        args.extend(test_files)

        try:
            result = pytest.main(args)
        except Exception as e:
            return {
                "exit_code": 1,
                "status": "error",
                "timestamp": datetime.now().isoformat(),
                "error": str(e)
            }

        return {
            "exit_code": result,
            "status": "success" if result == 0 else "failure",
            "timestamp": datetime.now().isoformat(),
            "test_files": test_files
        }

    def run_all_tests(self):
        """Run all test categories"""
        try:
            self.setup_test_environment()

            # Run tests in order: basic -> unit -> api -> integration -> websocket
            test_order = ["basic", "unit", "api", "integration", "analysis", "websocket", "e2e"]

            for category in test_order:
                if category in self.categories:
                    self.results["results"][category] = self.run_category_tests(
                        category, self.categories[category]
                    )

            # Save results
            self.save_results()

            # Print summary
            self.print_summary()

        except KeyboardInterrupt:
            print("\nTest run interrupted by user")
            sys.exit(1)
        except Exception as e:
            print(f"\nError during test execution: {str(e)}")
            sys.exit(1)

    def print_summary(self):
        """Print a summary of test results"""
        print("\n=== Test Summary ===")
        for category, result in self.results["results"].items():
            status = result.get("status", "unknown")
            if status == "success":
                print(f"{category}: ✅ Passed")
            elif status == "failure":
                print(f"{category}: ❌ Failed")
            elif status == "skipped":
                print(f"{category}: ⚠️  Skipped")
            else:
                print(f"{category}: ❓ Unknown")

    def save_results(self):
        """Save test results to a JSON file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = os.path.join(self.report_dir, f"test_results_{timestamp}.json")

        try:
            with open(filename, "w") as f:
                json.dump(self.results, f, indent=2)
            print(f"\nTest results saved to {filename}")
        except Exception as e:
            print(f"\nError saving results: {str(e)}")

if __name__ == "__main__":
    runner = TestRunner()
    runner.run_all_tests()
