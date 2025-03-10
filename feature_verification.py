#!/usr/bin/env python3
"""
Feature Verification Script for Harmonic Universe

This script systematically tests each feature and CRUD operation
in the Harmonic Universe application to verify implementation
in both backend and frontend.

Backend testing is done via direct API calls.
Frontend verification notes are included as comments.
"""

import requests
import json
import uuid
import time
import os
import sys
import argparse
from pprint import pprint
from datetime import datetime

# Parse command line arguments
parser = argparse.ArgumentParser(description="Feature verification script for Harmonic Universe")
parser.add_argument("--base-url", help="The base URL for the API", default="http://localhost:8000/api")
parser.add_argument("--mock-mode", action="store_true", help="Run in mock mode with predefined responses")
args = parser.parse_args()

# Configuration
BASE_URL = args.base_url
# Strip trailing slash if present
if BASE_URL.endswith('/'):
    BASE_URL = BASE_URL[:-1]
# Extract the API prefix to avoid double prefixing
if '/api' in BASE_URL:
    API_PREFIX = ""
else:
    API_PREFIX = "/api"

MOCK_MODE = args.mock_mode
DEMO_USER = {
    "email": "test@example.com",
    "password": "testpassword123",
    "username": "testuser"
}
CREATED_RESOURCES = {
    "users": [],
    "universes": [],
    "scenes": [],
    "physics_parameters": [],
    "physics_objects": [],
    "audio_tracks": []
}

print(f"Using API base URL: {BASE_URL}")
if MOCK_MODE:
    print("Running in MOCK MODE with simulated responses")

# Mock response class for testing without an actual API
class MockResponse:
    def __init__(self, json_data, status_code=200, headers=None):
        self.json_data = json_data
        self.status_code = status_code
        self.headers = headers or {}
        self.text = json.dumps(json_data)

    def json(self):
        return self.json_data

# Mock session class that returns predefined responses
class MockSession:
    def __init__(self):
        self.mock_data = {
            # Auth endpoints
            "POST:/api/auth/register": {"id": "mock-user-123", "email": "test@example.com", "username": "testuser"},
            "POST:/api/auth/login": {"access_token": "mock-token-123", "refresh_token": "mock-refresh-123"},
            "POST:/api/auth/refresh": {"access_token": "mock-token-new-123"},

            # User endpoints
            "GET:/api/users/me": {"id": "mock-user-123", "email": "test@example.com", "username": "testuser"},
            "PUT:/api/users/me": {"id": "mock-user-123", "email": "test@example.com", "username": "updated-user"},

            # Universe endpoints
            "GET:/api/universes/": [{"id": "mock-universe-123", "name": "Test Universe", "description": "Test description"}],
            "GET:/api/universes/mock-universe-123": {"id": "mock-universe-123", "name": "Test Universe", "description": "Test description"},
            "POST:/api/universes/": {"id": "mock-universe-123", "name": "Test Universe", "description": "Test description"},
            "PUT:/api/universes/mock-universe-123": {"id": "mock-universe-123", "name": "Updated Universe", "description": "Updated description"},
            "DELETE:/api/universes/mock-universe-123": {"deleted": True},

            # Scene endpoints
            "GET:/api/scenes/": [{"id": "mock-scene-123", "name": "Test Scene", "description": "Test description"}],
            "GET:/api/scenes/mock-scene-123": {"id": "mock-scene-123", "name": "Test Scene", "description": "Test description"},
            "POST:/api/scenes/": {"id": "mock-scene-123", "name": "Test Scene", "description": "Test description"},
            "PUT:/api/scenes/mock-scene-123": {"id": "mock-scene-123", "name": "Updated Scene", "description": "Updated description"},
            "DELETE:/api/scenes/mock-scene-123": {"deleted": True},
            "POST:/api/scenes/reorder": {"success": True},

            # Physics parameters endpoints
            "GET:/api/physics-parameters/": [{"id": "mock-params-123", "name": "Test Parameters", "gravity": 9.8}],
            "GET:/api/physics-parameters/mock-params-123": {"id": "mock-params-123", "name": "Test Parameters", "gravity": 9.8},
            "POST:/api/physics-parameters/": {"id": "mock-params-123", "name": "Test Parameters", "gravity": 9.8},
            "PUT:/api/physics-parameters/mock-params-123": {"id": "mock-params-123", "name": "Updated Parameters", "gravity": 8.2},
            "DELETE:/api/physics-parameters/mock-params-123": {"deleted": True},

            # Audio endpoints
            "GET:/api/audio/tracks": [{"id": "mock-audio-123", "name": "Test Audio", "scene_id": "mock-scene-123"}],
            "POST:/api/audio/generate": {"id": "mock-audio-123", "name": "Test Audio", "scene_id": "mock-scene-123"},
            "DELETE:/api/audio/tracks/mock-audio-123": {"deleted": True},

            # Health check
            "GET:/health": {"status": "ok"},
            "GET:/healthcheck": {"status": "ok"},
            "GET:/ping": {"status": "ok"},
            "GET:/status": {"status": "ok"},
            "GET:/api/health": {"status": "ok"},
        }

    def _get_mock_key(self, method, url):
        # Extract the path from the URL
        path = url.replace(BASE_URL, "")

        # Generate the key based on method and path
        key = f"{method}:{path}"

        # Try exact match first
        if key in self.mock_data:
            return key

        # Try with ID patterns
        for mock_key in self.mock_data.keys():
            method_part, path_part = mock_key.split(":", 1)
            if method == method_part and path_part in path:
                return mock_key

        return None

    def get(self, url, headers=None, params=None, **kwargs):
        key = self._get_mock_key("GET", url)
        if key:
            return MockResponse(self.mock_data[key])
        return MockResponse({"error": "Not found"}, 404)

    def post(self, url, json=None, headers=None, **kwargs):
        key = self._get_mock_key("POST", url)
        if key:
            return MockResponse(self.mock_data[key], 201)
        return MockResponse({"id": "mock-new-123", "created": True}, 201)

    def put(self, url, json=None, headers=None, **kwargs):
        key = self._get_mock_key("PUT", url)
        if key:
            return MockResponse(self.mock_data[key])
        return MockResponse({"id": "mock-updated-123", "updated": True})

    def delete(self, url, headers=None, **kwargs):
        key = self._get_mock_key("DELETE", url)
        if key:
            return MockResponse(self.mock_data[key])
        return MockResponse({"deleted": True})

class TestResult:
    """Class to track test results"""
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.skipped = 0
        self.results = []
        self.start_time = datetime.now()

    def add_result(self, feature, test, result, details=None):
        """Add a test result"""
        self.results.append({
            "feature": feature,
            "test": test,
            "result": result,
            "details": details or {},
            "timestamp": datetime.now().isoformat()
        })
        if result == "PASS":
            self.passed += 1
        elif result == "FAIL":
            self.failed += 1
        else:
            self.skipped += 1

    def summary(self):
        """Print a summary of test results"""
        print("\n==== TEST SUMMARY ====")
        print(f"TOTAL TESTS: {self.passed + self.failed + self.skipped}")
        print(f"PASSED: {self.passed}")
        print(f"FAILED: {self.failed}")
        print(f"SKIPPED: {self.skipped}")

        if self.failed > 0:
            print("\n==== FAILED TESTS ====")
            for result in self.results:
                if result["result"] == "FAIL":
                    print(f"- {result['feature']} | {result['test']} - {result.get('details', {}).get('error', '')}")

        return self.failed == 0

    def generate_html_report(self, output_file=None):
        """Generate an HTML report of test results"""
        # Create a reports directory if it doesn't exist
        reports_dir = "test_reports"
        os.makedirs(reports_dir, exist_ok=True)

        # Create a timestamped filename if none is provided
        if output_file is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_file = f"test_report_{timestamp}.html"

        # If only a filename is provided (no path), put it in the reports directory
        if os.path.dirname(output_file) == "":
            output_file = os.path.join(reports_dir, output_file)

        feature_groups = {}

        # Group results by feature
        for result in self.results:
            feature = result["feature"]
            if feature not in feature_groups:
                feature_groups[feature] = []
            feature_groups[feature].append(result)

        # Calculate execution time
        execution_time = datetime.now() - self.start_time

        # Generate HTML content
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe - Feature Verification Report</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        h1 {{
            color: #2c3e50;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }}
        .summary {{
            background-color: #f8f9fa;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
        }}
        .summary-box {{
            text-align: center;
            padding: 10px;
            border-radius: 5px;
            flex: 1;
            margin: 0 5px;
        }}
        .pass-box {{
            background-color: #d4edda;
            color: #155724;
        }}
        .fail-box {{
            background-color: #f8d7da;
            color: #721c24;
        }}
        .skip-box {{
            background-color: #fff3cd;
            color: #856404;
        }}
        .total-box {{
            background-color: #e2e3e5;
            color: #383d41;
        }}
        .feature-section {{
            margin-bottom: 30px;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            overflow: hidden;
        }}
        .feature-header {{
            background-color: #e9ecef;
            padding: 10px 15px;
            font-weight: bold;
            border-bottom: 1px solid #dee2e6;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
        }}
        th, td {{
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }}
        th {{
            background-color: #f8f9fa;
        }}
        .result-pass {{
            color: #28a745;
            font-weight: bold;
        }}
        .result-fail {{
            color: #dc3545;
            font-weight: bold;
        }}
        .result-skip {{
            color: #ffc107;
            font-weight: bold;
        }}
        .timestamp {{
            color: #6c757d;
            font-size: 0.85em;
        }}
        .meta-info {{
            font-size: 0.9em;
            color: #6c757d;
            margin-top: 5px;
        }}
        .expandable {{
            cursor: pointer;
        }}
        .details-row {{
            display: none;
            background-color: #f8f9fa;
        }}
        .details-cell {{
            padding: 15px;
        }}
        pre {{
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
        }}
        .mock-mode-banner {{
            background-color: #fff3cd;
            color: #856404;
            padding: 10px 15px;
            margin-bottom: 20px;
            border-radius: 5px;
            border: 1px solid #ffeeba;
        }}
        .error-message {{
            color: #dc3545;
            font-weight: bold;
        }}
        .request-info {{
            margin-top: 5px;
            margin-bottom: 5px;
        }}
    </style>
    <script>
        function toggleDetails(rowId) {{
            const detailsRow = document.getElementById(rowId);
            if (detailsRow.style.display === 'table-row') {{
                detailsRow.style.display = 'none';
            }} else {{
                detailsRow.style.display = 'table-row';
            }}
        }}
    </script>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe - Feature Verification Report</h1>

        <div class="meta-info">
            <strong>Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            <br>
            <strong>Execution Time:</strong> {execution_time.total_seconds():.2f} seconds
        </div>

        {"<div class='mock-mode-banner'><strong>NOTE:</strong> This report was generated in MOCK MODE with simulated API responses.<br>These results are for verification script testing only and do not represent actual API functionality.</div>" if MOCK_MODE else ""}

        <div class="summary">
            <div class="summary-box total-box">
                <h2>{self.passed + self.failed + self.skipped}</h2>
                <div>Total Tests</div>
            </div>
            <div class="summary-box pass-box">
                <h2>{self.passed}</h2>
                <div>Passed</div>
            </div>
            <div class="summary-box fail-box">
                <h2>{self.failed}</h2>
                <div>Failed</div>
            </div>
            <div class="summary-box skip-box">
                <h2>{self.skipped}</h2>
                <div>Skipped</div>
            </div>
        </div>

        <h2>Test Results</h2>
"""

        # Add feature sections
        for feature, results in feature_groups.items():
            # Calculate feature stats
            feature_passed = sum(1 for r in results if r["result"] == "PASS")
            feature_failed = sum(1 for r in results if r["result"] == "FAIL")
            feature_skipped = sum(1 for r in results if r["result"] == "SKIP")
            feature_total = len(results)

            html += f"""
        <div class="feature-section">
            <div class="feature-header">
                {feature} ({feature_passed}/{feature_total} passed)
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Test</th>
                        <th>Result</th>
                        <th>Timestamp</th>
                    </tr>
                </thead>
                <tbody>
"""

            # Add rows for each test
            for i, result in enumerate(results):
                result_class = {
                    "PASS": "result-pass",
                    "FAIL": "result-fail",
                    "SKIP": "result-skip"
                }.get(result["result"], "")

                details = result.get("details", {})
                # Ensure details is a dictionary
                if details is None:
                    details = {}
                elif not isinstance(details, dict):
                    # Convert to dict if it's another type
                    if isinstance(details, list):
                        details = {"items": details}
                    else:
                        try:
                            details = {"value": str(details)}
                        except:
                            details = {}

                # Extract error information
                error = ""
                if result["result"] == "FAIL":
                    if isinstance(details, dict) and "error" in details:
                        error = details.get("error", "")
                    elif isinstance(details, str):
                        error = details

                # For failed tests, always display details row
                has_details = bool(details) or result["result"] == "FAIL"
                row_id = f"details-{feature.replace(' ', '-')}-{i}"

                # Build the onclick attribute without using backslashes in f-string
                onclick_attr = f"toggleDetails('{row_id}')" if has_details else ""

                # Create the class attribute
                class_attr = "expandable" if has_details else ""

                html += f"""
                    <tr class="{class_attr}" {f'onclick="{onclick_attr}"' if has_details else ""}>
                        <td>{result["test"]}</td>
                        <td class="{result_class}">{result["result"]}</td>
                        <td class="timestamp">{datetime.fromisoformat(result["timestamp"]).strftime('%H:%M:%S')}</td>
                    </tr>
"""

                if has_details:
                    # Safe JSON conversion
                    try:
                        if error:
                            # Add request/response information if available
                            request_info = ""
                            if isinstance(details, dict):
                                url = details.get("url", "")
                                method = details.get("method", "")
                                status_code = details.get("status_code", "")
                                response_text = details.get("response_text", "")

                                if url or method or status_code:
                                    request_info = f"URL: {url}<br>Method: {method}<br>Status: {status_code}<br>"
                                    if response_text:
                                        request_info += f"Response: {response_text}"

                            details_json = ""
                        else:
                            # Remove error from details to avoid duplication
                            details_copy = details.copy() if isinstance(details, dict) else {}
                            if "error" in details_copy:
                                del details_copy["error"]
                            details_json = json.dumps(details_copy, indent=2) if details_copy else ""
                    except:
                        details_json = str(details)

                    html += f"""
                    <tr id="{row_id}" class="details-row">
                        <td colspan="3" class="details-cell">
"""

                    if error:
                        html += f"""
                            <strong>Error:</strong>
                            <pre class="error-message">{error}</pre>
"""

                        # Display request info if available
                        if 'request_info' in locals() and request_info:
                            html += f"""
                            <strong>Request Information:</strong>
                            <div class="request-info">{request_info}</div>
"""

                    if details_json:
                        html += f"""
                            <strong>Details:</strong>
                            <pre>{details_json}</pre>
"""

                    html += """
                        </td>
                    </tr>
"""

            html += """
                </tbody>
            </table>
        </div>
"""

        # Close HTML
        html += """
    </div>
</body>
</html>
"""

        # Write to file
        with open(output_file, "w") as f:
            f.write(html)

        print(f"\nHTML report generated: {os.path.abspath(output_file)}")
        return os.path.abspath(output_file)

class HarmonicUniverseTester:
    """Class to test Harmonic Universe features"""

    def __init__(self):
        if MOCK_MODE:
            self.session = MockSession()
            print("Using mock session for API calls")
        else:
            self.session = requests.Session()
        self.tokens = {}
        self.test_results = TestResult()
        self.current_feature = None

    def set_feature(self, feature_name):
        """Set the current feature being tested"""
        self.current_feature = feature_name
        print(f"\n==== Testing Feature: {feature_name} ====")

    def test(self, test_name, func, *args, **kwargs):
        """Run a test and record the result"""
        print(f"  - Testing: {test_name}...")
        try:
            result = func(*args, **kwargs)
            self.test_results.add_result(self.current_feature, test_name, "PASS", result)
            print(f"    ✅ PASS")
            return result
        except Exception as e:
            self.test_results.add_result(self.current_feature, test_name, "FAIL", {"error": str(e)})
            print(f"    ❌ FAIL: {str(e)}")
            return None

    def cleanup(self):
        """Clean up created resources"""
        # Delete in reverse order of dependencies
        print("\n==== Cleaning up resources ====")

        for audio_track_id in CREATED_RESOURCES["audio_tracks"]:
            try:
                self.session.delete(f"{BASE_URL}/api/audio/tracks/{audio_track_id}", headers=self.auth_header())
                print(f"  ✓ Deleted audio track: {audio_track_id}")
            except:
                print(f"  ✗ Failed to delete audio track: {audio_track_id}")

        for physics_object_id in CREATED_RESOURCES["physics_objects"]:
            try:
                self.session.delete(f"{BASE_URL}/api/physics-objects/{physics_object_id}", headers=self.auth_header())
                print(f"  ✓ Deleted physics object: {physics_object_id}")
            except:
                print(f"  ✗ Failed to delete physics object: {physics_object_id}")

        for physics_param_id in CREATED_RESOURCES["physics_parameters"]:
            try:
                self.session.delete(f"{BASE_URL}/api/physics-parameters/{physics_param_id}", headers=self.auth_header())
                print(f"  ✓ Deleted physics parameters: {physics_param_id}")
            except:
                print(f"  ✗ Failed to delete physics parameters: {physics_param_id}")

        for scene_id in CREATED_RESOURCES["scenes"]:
            try:
                self.session.delete(f"{BASE_URL}/api/scenes/{scene_id}", headers=self.auth_header())
                print(f"  ✓ Deleted scene: {scene_id}")
            except:
                print(f"  ✗ Failed to delete scene: {scene_id}")

        for universe_id in CREATED_RESOURCES["universes"]:
            try:
                self.session.delete(f"{BASE_URL}/api/universes/{universe_id}", headers=self.auth_header())
                print(f"  ✓ Deleted universe: {universe_id}")
            except:
                print(f"  ✗ Failed to delete universe: {universe_id}")

    def auth_header(self):
        """Get authentication header"""
        return {"Authorization": f"Bearer {self.tokens.get('access_token', '')}"}

    def register_user(self, username=None, email=None, password=None):
        """Register a new user for testing."""
        if MOCK_MODE:
            return {"user_id": "mock-user-123", "access_token": "mock-token", "refresh_token": "mock-refresh-token"}

        payload = {
            "username": username or f"testuser_{int(time.time())}",
            "email": email or f"testuser_{int(time.time())}@example.com",
            "password": password or "Test123!"
        }

        print(f"\nDEBUG: Registration payload: {payload}")

        try:
            response = self.session.post(f"{BASE_URL}{API_PREFIX}/auth/register", json=payload)

            print(f"DEBUG: Registration response status: {response.status_code}")
            print(f"DEBUG: Registration response headers: {response.headers}")
            print(f"DEBUG: Registration response body: {response.text}")

            if response.status_code == 201:
                data = response.json()
                self.tokens["access_token"] = data.get("access_token")
                self.tokens["refresh_token"] = data.get("refresh_token")
                return data
            else:
                print(f"Failed to register user: {response.text}")
                return None
        except requests.RequestException as e:
            print(f"Request error during registration: {str(e)}")
            return None

    def login_user(self, email, password):
        """Test user login"""
        data = {
            "email": email,
            "password": password
        }

        try:
            response = self.session.post(f"{BASE_URL}{API_PREFIX}/auth/login", json=data)
            if response.status_code != 200:
                raise Exception(f"Failed to log in: {response.text}")

            response_data = response.json()

            # Most APIs return tokens directly in the response
            if "access_token" in response_data:
                self.tokens = {
                    "access_token": response_data.get("access_token"),
                    "refresh_token": response_data.get("refresh_token", "")
                }
                return response_data

            # Some APIs nest tokens under a "tokens" key
            if "tokens" in response_data:
                tokens = response_data.get("tokens")
                self.tokens = {
                    "access_token": tokens.get("access_token"),
                    "refresh_token": tokens.get("refresh_token", "")
                }
                return response_data

            # If no tokens were found, the API might have a different response structure
            print(f"Warning: No tokens found in login response: {response_data}")
            return response_data
        except requests.exceptions.RequestException as e:
            raise Exception(f"Connection error during login: {str(e)}")

    def get_profile(self):
        """Get current user profile"""

        # Try different URL formats that might be used for the profile endpoint
        urls_to_try = [
            f"{BASE_URL}{API_PREFIX}/users/me",
            f"{BASE_URL}{API_PREFIX}/users/profile",
            f"{BASE_URL}{API_PREFIX}/user/profile"  # This is likely incorrect but included for completeness
        ]

        for url in urls_to_try:
            try:
                response = self.session.get(url, headers=self.auth_header())
                if response.status_code == 200:
                    return response.json()
            except Exception as e:
                print(f"Error trying {url}: {str(e)}")

        # If none of the URLs worked, try the last one again and let it raise the exception
        response = self.session.get(urls_to_try[0], headers=self.auth_header())
        if response.status_code != 200:
            raise Exception(f"Failed to get profile: {response.text}")

        return response.json()

    def update_profile(self):
        """Update user profile"""
        data = {
            "username": f"updated_user_{uuid.uuid4().hex[:8]}"
        }

        # Try different URL formats that might be used for the profile update endpoint
        urls_to_try = [
            f"{BASE_URL}{API_PREFIX}/users/me",
            f"{BASE_URL}{API_PREFIX}/users/profile",
            f"{BASE_URL}{API_PREFIX}/user/profile"  # This is likely incorrect but included for completeness
        ]

        for url in urls_to_try:
            try:
                response = self.session.put(url, json=data, headers=self.auth_header())
                if response.status_code == 200:
                    return response.json()
            except Exception as e:
                print(f"Error trying {url}: {str(e)}")

        # If none of the URLs worked, try the first one again and let it raise the exception
        response = self.session.put(urls_to_try[0], json=data, headers=self.auth_header())
        if response.status_code != 200:
            raise Exception(f"Failed to update profile: {response.text}")

        return response.json()

    def refresh_token(self):
        """Test token refresh endpoint"""
        if not self.tokens.get("refresh_token"):
            raise Exception("No refresh token available")

        try:
            refresh_headers = {
                "Authorization": f"Bearer {self.tokens.get('refresh_token')}",
                "Content-Type": "application/json"
            }

            response = self.session.post(
                f"{BASE_URL}{API_PREFIX}/auth/refresh",
                headers=refresh_headers
            )

            if response.status_code != 200:
                raise Exception(f"Failed to refresh token: {response.text}")

            response_data = response.json()
            new_token = response_data.get("access_token")

            if new_token:
                self.tokens["access_token"] = new_token

            return response_data
        except requests.exceptions.RequestException as e:
            raise Exception(str(e))

    def test_auth_features(self):
        """Test user authentication features"""
        self.set_feature("User Authentication")

        # Test user registration
        user = self.test("User registration", self.register_user)

        # Test token refresh
        self.test("Token refresh", self.refresh_token)

        # Test profile retrieval
        self.test("User profile retrieval", self.get_profile)

        # Test profile update
        self.test("User profile update", self.update_profile)

    def test_universe_features(self):
        """Test universe management features"""
        self.set_feature("Universe Management")

        def create_universe():
            """Create a new universe"""
            data = {
                "name": f"Test Universe {uuid.uuid4().hex[:8]}",
                "description": "A test universe for API verification",
                "visibility": "public",
                "default_physics": {
                    "gravity": 9.8,
                    "time_scale": 1.0
                }
            }

            response = self.session.post(f"{BASE_URL}{API_PREFIX}/universes/", json=data, headers=self.auth_header())
            if response.status_code not in [200, 201]:
                raise Exception(f"Failed to create universe: {response.text}")

            universe = response.json()
            universe_id = universe.get("id")

            if universe_id:
                CREATED_RESOURCES["universes"].append(universe_id)

            return universe

        universe = self.test("Create universe", create_universe)

        def list_universes():
            response = self.session.get(f"{BASE_URL}{API_PREFIX}/universes/", headers=self.auth_header())
            if response.status_code != 200:
                raise Exception(f"Failed to list universes: {response.text}")

            return response.json()

        universes = self.test("List universes", list_universes)

        # If we have a universe, test more operations on it
        if universe:
            universe_id = universe.get("id")

            def get_universe():
                response = self.session.get(f"{BASE_URL}{API_PREFIX}/universes/{universe_id}", headers=self.auth_header())
                if response.status_code != 200:
                    raise Exception(f"Failed to get universe: {response.text}")

                return response.json()

            self.test("Get single universe", get_universe)

            def update_universe():
                data = {
                    "name": f"Updated Universe {uuid.uuid4().hex[:8]}",
                    "description": "An updated test universe"
                }

                response = self.session.put(f"{BASE_URL}{API_PREFIX}/universes/{universe_id}", json=data, headers=self.auth_header())
                if response.status_code != 200:
                    raise Exception(f"Failed to update universe: {response.text}")

                return response.json()

            self.test("Update universe", update_universe)

            def update_universe_physics():
                data = {
                    "physics_params": {
                        "gravity": 5.5,
                        "time_scale": 2.0,
                        "air_resistance": 0.1
                    }
                }

                response = self.session.put(
                    f"{BASE_URL}{API_PREFIX}/universes/{universe_id}/physics",
                    json=data,
                    headers=self.auth_header()
                )

                if response.status_code != 200:
                    raise Exception(f"Failed to update universe physics: {response.text}")

                return response.json()

            self.test("Update universe physics", update_universe_physics)

            def delete_universe():
                # Create a temporary universe to delete
                temp_data = {
                    "name": f"Temp Universe {uuid.uuid4().hex[:8]}",
                    "description": "A temporary universe for deletion test"
                }

                create_response = self.session.post(
                    f"{BASE_URL}{API_PREFIX}/universes/",
                    json=temp_data,
                    headers=self.auth_header()
                )

                if create_response.status_code not in [200, 201]:
                    raise Exception(f"Failed to create temporary universe: {create_response.text}")

                temp_id = create_response.json().get("id")

                # Now delete it
                delete_response = self.session.delete(
                    f"{BASE_URL}{API_PREFIX}/universes/{temp_id}",
                    headers=self.auth_header()
                )

                if delete_response.status_code not in [200, 204]:
                    raise Exception(f"Failed to delete universe: {delete_response.text}")

                return {"success": True, "deleted_id": temp_id}

            self.test("Delete universe", delete_universe)

    def test_scene_features(self):
        """Test scene management features"""
        self.set_feature("Scene Management")

        # First, make sure we have a universe to work with
        universe_response = self.session.get(f"{BASE_URL}{API_PREFIX}/universes/", headers=self.auth_header())
        if universe_response.status_code != 200 or not universe_response.json():
            # Create a universe if none exists
            universe_data = {
                "name": f"Universe for Scene Tests {uuid.uuid4().hex[:8]}",
                "description": "This universe is for testing scenes",
                "is_public": True,
                "is_active": True
            }
            universe_response = self.session.post(
                f"{BASE_URL}{API_PREFIX}/universes/",
                json=universe_data,
                headers=self.auth_header()
            )

            if universe_response.status_code != 201:
                raise Exception("Failed to create universe for scene tests")

        universe = universe_response.json()
        if isinstance(universe, list):
            universe = universe[0]

        universe_id = universe.get("id")
        CREATED_RESOURCES["universes"].append(universe_id)

        # Test create scene
        def create_scene():
            data = {
                "name": f"Test Scene {uuid.uuid4().hex[:8]}",
                "description": "This is a test scene created by the verification script",
                "universe_id": universe_id,
                "order": 1
            }
            response = self.session.post(f"{BASE_URL}{API_PREFIX}/scenes/", json=data, headers=self.auth_header())
            if response.status_code != 201:
                raise Exception(f"Failed to create scene: {response.text}")

            scene = response.json()
            CREATED_RESOURCES["scenes"].append(scene.get("id"))
            return scene

        scene = self.test("Create scene", create_scene)

        # Test list scenes
        def list_scenes():
            response = self.session.get(
                f"{BASE_URL}{API_PREFIX}/scenes/?universe_id={universe_id}",
                headers=self.auth_header()
            )
            if response.status_code != 200:
                raise Exception(f"Failed to list scenes: {response.text}")
            return response.json()

        self.test("List scenes", list_scenes)

        if scene:
            scene_id = scene.get("id")

            # Test get single scene
            def get_scene():
                response = self.session.get(f"{BASE_URL}{API_PREFIX}/scenes/{scene_id}", headers=self.auth_header())
                if response.status_code != 200:
                    raise Exception(f"Failed to get scene: {response.text}")
                return response.json()

            self.test("Get single scene", get_scene)

            # Test update scene
            def update_scene():
                data = {
                    "name": f"Updated Scene {uuid.uuid4().hex[:8]}",
                    "description": "This scene has been updated"
                }
                response = self.session.put(f"{BASE_URL}{API_PREFIX}/scenes/{scene_id}", json=data, headers=self.auth_header())
                if response.status_code != 200:
                    raise Exception(f"Failed to update scene: {response.text}")
                return response.json()

            self.test("Update scene", update_scene)

            # Create a second scene for reordering test
            second_scene_data = {
                "name": f"Second Test Scene {uuid.uuid4().hex[:8]}",
                "description": "This is another test scene for reordering",
                "universe_id": universe_id,
                "order": 2
            }
            second_scene_response = self.session.post(
                f"{BASE_URL}{API_PREFIX}/scenes/",
                json=second_scene_data,
                headers=self.auth_header()
            )

            if second_scene_response.status_code == 201:
                second_scene_id = second_scene_response.json().get("id")
                CREATED_RESOURCES["scenes"].append(second_scene_id)

                # Test reorder scenes
                def reorder_scenes():
                    data = {
                        "universe_id": universe_id,
                        "scene_ids": [second_scene_id, scene_id]  # Reverse the order
                    }
                    try:
                        # First try with /api/scenes/reorder
                        response = self.session.post(
                            f"{BASE_URL}{API_PREFIX}/scenes/reorder",
                            json=data,
                            headers=self.auth_header()
                        )

                        # If that fails, try alternative endpoint
                        if response.status_code != 200:
                            response = self.session.post(
                                f"{BASE_URL}{API_PREFIX}/universes/{universe_id}/reorder-scenes",
                                json={"scene_ids": [second_scene_id, scene_id]},
                                headers=self.auth_header()
                            )

                        if response.status_code not in [200, 201]:
                            raise Exception(f"Failed to reorder scenes: {response.text}")

                        # Process the response data
                        response_data = response.json()

                        # Handle different response formats
                        if isinstance(response_data, dict) and "success" in response_data:
                            # Some APIs just return {"success": true}
                            return response_data
                        elif isinstance(response_data, list):
                            # Some APIs return the list of updated scenes
                            return {"scenes": response_data}
                        else:
                            return response_data
                    except Exception as e:
                        if MOCK_MODE:
                            # In mock mode, return success if there's an error
                            return {"mock": True, "success": True}
                        else:
                            raise e

                self.test("Reorder scenes", reorder_scenes)

            # Test delete scene (we'll create a temporary one for this)
            def delete_scene():
                # Create a temporary scene to delete
                temp_data = {
                    "name": f"Temp Scene to Delete {uuid.uuid4().hex[:8]}",
                    "description": "This scene will be deleted",
                    "universe_id": universe_id,
                    "order": 3
                }
                create_response = self.session.post(
                    f"{BASE_URL}{API_PREFIX}/scenes/",
                    json=temp_data,
                    headers=self.auth_header()
                )

                if create_response.status_code != 201:
                    raise Exception(f"Failed to create temp scene: {create_response.text}")

                temp_id = create_response.json().get("id")

                # Now delete it
                delete_response = self.session.delete(
                    f"{BASE_URL}{API_PREFIX}/scenes/{temp_id}",
                    headers=self.auth_header()
                )

                if delete_response.status_code != 200:
                    # If delete fails, add to cleanup list
                    CREATED_RESOURCES["scenes"].append(temp_id)
                    raise Exception(f"Failed to delete scene: {delete_response.text}")

                return {"deleted": True, "id": temp_id}

            self.test("Delete scene", delete_scene)

    def test_physics_parameters(self):
        """Test physics parameters features"""
        self.set_feature("Physics Parameters")

        # First, ensure we have a universe to work with
        universe_response = self.session.get(f"{BASE_URL}{API_PREFIX}/universes/", headers=self.auth_header())
        if universe_response.status_code != 200 or not universe_response.json():
            # Create a universe if none exists
            universe_data = {
                "name": f"Universe for Physics Tests {uuid.uuid4().hex[:8]}",
                "description": "This universe is for testing physics parameters",
                "is_public": True
            }
            universe_response = self.session.post(
                f"{BASE_URL}{API_PREFIX}/universes/",
                json=universe_data,
                headers=self.auth_header()
            )

            if universe_response.status_code != 201:
                raise Exception("Failed to create universe for physics tests")

        universe = universe_response.json()
        if isinstance(universe, list):
            universe = universe[0]

        universe_id = universe.get("id")
        CREATED_RESOURCES["universes"].append(universe_id)

        # Test create physics parameters
        def create_physics_parameters():
            data = {
                "name": f"Test Physics Parameters {uuid.uuid4().hex[:8]}",
                "universe_id": universe_id,
                "gravity": 9.8,
                "friction": 0.5,
                "restitution": 0.7
            }
            response = self.session.post(
                f"{BASE_URL}{API_PREFIX}/physics-parameters/",
                json=data,
                headers=self.auth_header()
            )
            if response.status_code != 201:
                raise Exception(f"Failed to create physics parameters: {response.text}")

            params = response.json()
            CREATED_RESOURCES["physics_parameters"].append(params.get("id"))
            return params

        physics_params = self.test("Create physics parameters", create_physics_parameters)

        # Test list physics parameters
        def list_physics_parameters():
            # Try first with the universe_id query parameter
            response = self.session.get(
                f"{BASE_URL}{API_PREFIX}/physics-parameters/?universe_id={universe_id}",
                headers=self.auth_header()
            )

            # If that fails, try with the universe/universe_id path
            if response.status_code != 200:
                response = self.session.get(
                    f"{BASE_URL}{API_PREFIX}/physics-parameters/universe/{universe_id}",
                    headers=self.auth_header()
                )

            if response.status_code != 200:
                raise Exception(f"Failed to list physics parameters: {response.text}")

            return response.json()

        self.test("List physics parameters", list_physics_parameters)

        if physics_params:
            params_id = physics_params.get("id")

            # Test get single physics parameter
            def get_physics_parameters():
                response = self.session.get(
                    f"{BASE_URL}{API_PREFIX}/physics-parameters/{params_id}",
                    headers=self.auth_header()
                )
                if response.status_code != 200:
                    raise Exception(f"Failed to get physics parameters: {response.text}")
                return response.json()

            self.test("Get single physics parameter", get_physics_parameters)

            # Test update physics parameters
            def update_physics_parameters():
                data = {
                    "name": f"Updated Physics Parameters {uuid.uuid4().hex[:8]}",
                    "gravity": 8.2,
                    "friction": 0.4
                }
                response = self.session.put(
                    f"{BASE_URL}{API_PREFIX}/physics-parameters/{params_id}",
                    json=data,
                    headers=self.auth_header()
                )
                if response.status_code != 200:
                    raise Exception(f"Failed to update physics parameters: {response.text}")
                return response.json()

            self.test("Update physics parameters", update_physics_parameters)

            # Test delete physics parameters (we'll create a temporary one for this)
            def delete_physics_parameters():
                # Create a temporary physics parameters to delete
                temp_data = {
                    "name": f"Temp Physics Parameters to Delete {uuid.uuid4().hex[:8]}",
                    "universe_id": universe_id,
                    "gravity": 10.0,
                    "friction": 0.3
                }
                create_response = self.session.post(
                    f"{BASE_URL}{API_PREFIX}/physics-parameters/",
                    json=temp_data,
                    headers=self.auth_header()
                )

                if create_response.status_code != 201:
                    raise Exception(f"Failed to create temp physics parameters: {create_response.text}")

                temp_id = create_response.json().get("id")

                # Now delete it
                delete_response = self.session.delete(
                    f"{BASE_URL}{API_PREFIX}/physics-parameters/{temp_id}",
                    headers=self.auth_header()
                )

                if delete_response.status_code != 200:
                    # If delete fails, add to cleanup list
                    CREATED_RESOURCES["physics_parameters"].append(temp_id)
                    raise Exception(f"Failed to delete physics parameters: {delete_response.text}")

                return {"deleted": True, "id": temp_id}

            self.test("Delete physics parameters", delete_physics_parameters)

    def test_audio_generation(self):
        """Test audio generation features"""
        self.set_feature("Audio Generation")

        # First, ensure we have a universe and scene to work with
        universe_response = self.session.get(f"{BASE_URL}{API_PREFIX}/universes/", headers=self.auth_header())

        # Create a universe if none exists
        if universe_response.status_code != 200 or not universe_response.json():
            universe_data = {
                "name": f"Universe for Audio Tests {uuid.uuid4().hex[:8]}",
                "description": "This universe is for testing audio generation",
                "is_public": True
            }
            universe_response = self.session.post(
                f"{BASE_URL}{API_PREFIX}/universes/",
                json=universe_data,
                headers=self.auth_header()
            )

            if universe_response.status_code != 201:
                raise Exception("Failed to create universe for audio tests")

        universe = universe_response.json()
        if isinstance(universe, list):
            universe = universe[0]

        universe_id = universe.get("id")
        CREATED_RESOURCES["universes"].append(universe_id)

        # Create a scene for audio testing
        scene_data = {
            "name": f"Scene for Audio Tests {uuid.uuid4().hex[:8]}",
            "description": "This scene is for testing audio generation",
            "universe_id": universe_id,
            "order": 1
        }
        scene_response = self.session.post(
            f"{BASE_URL}{API_PREFIX}/scenes/",
            json=scene_data,
            headers=self.auth_header()
        )

        if scene_response.status_code != 201:
            raise Exception("Failed to create scene for audio tests")

        scene_id = scene_response.json().get("id")
        CREATED_RESOURCES["scenes"].append(scene_id)

        # Test generate audio
        def generate_audio():
            data = {
                "scene_id": scene_id,
                "name": f"Test Audio {uuid.uuid4().hex[:8]}",
                "parameters": {
                    "tempo": 120,
                    "key": "C",
                    "scale": "major",
                    "duration": 30
                }
            }
            response = self.session.post(
                f"{BASE_URL}{API_PREFIX}/audio/generate",
                json=data,
                headers=self.auth_header()
            )
            if response.status_code != 201:
                raise Exception(f"Failed to generate audio: {response.text}")

            audio = response.json()
            CREATED_RESOURCES["audio_tracks"].append(audio.get("id"))
            return audio

        audio_track = self.test("Generate audio", generate_audio)

        # The rest of audio tests depend on audio generation succeeding
        if audio_track:
            audio_id = audio_track.get("id")

            # Test get audio tracks
            def get_audio_tracks():
                # Try with query parameter first
                response = self.session.get(
                    f"{BASE_URL}{API_PREFIX}/audio/tracks?scene_id={scene_id}",
                    headers=self.auth_header()
                )

                # If that fails, try without query parameter
                if response.status_code != 200:
                    response = self.session.get(
                        f"{BASE_URL}{API_PREFIX}/audio/tracks",
                        headers=self.auth_header()
                    )

                if response.status_code != 200:
                    raise Exception(f"Failed to get audio tracks: {response.text}")

                return response.json()

            self.test("Get audio tracks", get_audio_tracks)

            # Test get audio file
            def get_audio_file():
                try:
                    # Try first format
                    response = self.session.get(
                        f"{BASE_URL}{API_PREFIX}/audio/file/{audio_id}",
                        headers=self.auth_header()
                    )

                    # If that fails, try alternative format
                    if response.status_code != 200:
                        response = self.session.get(
                            f"{BASE_URL}{API_PREFIX}/audio/{audio_id}/file",
                            headers=self.auth_header()
                        )

                    if response.status_code != 200:
                        raise Exception(f"Failed to get audio file: {response.status_code}")

                    # We can't return the audio data itself as it's binary
                    return {"success": True, "content_type": response.headers.get("Content-Type")}
                except Exception as e:
                    if MOCK_MODE:
                        # In mock mode, return a simulated audio file response
                        return {"mock": True, "success": True, "content_type": "audio/mpeg"}
                    else:
                        raise e

            self.test("Get audio file", get_audio_file)

            # Test delete audio track
            def delete_audio_track():
                # Try first format
                response = self.session.delete(
                    f"{BASE_URL}{API_PREFIX}/audio/tracks/{audio_id}",
                    headers=self.auth_header()
                )

                # If that fails, try alternative format
                if response.status_code != 200:
                    response = self.session.delete(
                        f"{BASE_URL}{API_PREFIX}/audio/{audio_id}",
                        headers=self.auth_header()
                    )

                if response.status_code != 200:
                    raise Exception(f"Failed to delete audio track: {response.text}")

                # Remove from cleanup list as it's already deleted
                if audio_id in CREATED_RESOURCES["audio_tracks"]:
                    CREATED_RESOURCES["audio_tracks"].remove(audio_id)

                return {"deleted": True}

            self.test("Delete audio track", delete_audio_track)

    def run_all_tests(self):
        """Run all tests"""
        try:
            # Check if API is accessible before starting tests
            if not MOCK_MODE:
                try:
                    # Try different health endpoint paths
                    health_paths = [
                        "/health",
                        "/api/health",
                        "/healthcheck",
                        "/api/healthcheck",
                        "/ping",
                        "/api/ping",
                        "/status",
                        "/api/status"
                    ]
                    api_accessible = False
                    response_status = None
                    error_details = []

                    # Try base URL with and without /api
                    base_urls_to_try = [BASE_URL]
                    if BASE_URL.endswith('/api'):
                        base_urls_to_try.append(BASE_URL[:-4])
                    elif '/api' not in BASE_URL:
                        base_urls_to_try.append(f"{BASE_URL}/api")

                    for base_url in base_urls_to_try:
                        for path in health_paths:
                            try:
                                health_url = f"{base_url}{path}"
                                print(f"Trying health check at: {health_url}")
                                health_check = requests.get(health_url, timeout=3)
                                response_status = health_check.status_code

                                if health_check.status_code < 400:  # Accept any non-error status
                                    api_accessible = True
                                    print(f"API health check successful at {health_url}")
                                    break
                                else:
                                    error_details.append(f"Status {health_check.status_code} at {health_url}")
                            except Exception as e:
                                error_details.append(f"Error at {base_url}{path}: {str(e)}")
                                continue

                        if api_accessible:
                            break

                    if not api_accessible:
                        print(f"\n❌ Error: API health check failed")
                        if response_status:
                            print(f"Last status code: {response_status}")
                        print(f"Make sure the server is running and accessible at {BASE_URL}")
                        print("\nAttempted the following health check endpoints:")
                        for error in error_details[:5]:  # Show only the first 5 errors to avoid clutter
                            print(f"  - {error}")
                        if len(error_details) > 5:
                            print(f"  - ... and {len(error_details) - 5} more attempts")

                        if not MOCK_MODE:  # Only exit if not in mock mode
                            print("\nContinuing with tests in case endpoints exist but health checks don't...")
                except requests.exceptions.RequestException as e:
                    print(f"\n❌ Error: Cannot connect to API at {BASE_URL}")
                    print(f"Error details: {str(e)}")
                    print("Make sure the server is running before running tests.")
                    if not MOCK_MODE:  # Only exit if not in mock mode
                        print("\nContinuing with tests in case API is accessible but responding slowly...")

            # Start with authentication
            self.test_auth_features()

            # Then universe management
            self.test_universe_features()

            # Then scene management
            self.test_scene_features()

            # Then physics parameters
            self.test_physics_parameters()

            # Then audio generation
            self.test_audio_generation()

            # Clean up created resources
            self.cleanup()

            # Print summary
            summary_result = self.test_results.summary()

            # Generate HTML report
            report_path = self.test_results.generate_html_report()

            # Provide additional guidance based on test results
            if summary_result:
                print(f"\n✅ All tests passed! The checked features appear to be implemented correctly.")
            else:
                print(f"\n❌ Some tests failed. Please check the HTML report for detailed information.")
                if not MOCK_MODE:
                    print("\nTips for resolving issues:")
                    print("1. Check that your API server is running")
                    print("2. Verify the API endpoint paths match what your verification script expects")
                    print("3. Run the script with --mock-mode to see the expected API behavior")
                    print("4. Review the API response formats vs what the script expects")

            return summary_result, report_path
        except Exception as e:
            print(f"\n❌ Error running tests: {str(e)}")
            # Try to generate a report even if tests fail
            try:
                if hasattr(self, 'test_results') and self.test_results is not None:
                    report_path = self.test_results.generate_html_report()
                    return False, report_path
            except Exception as report_error:
                print(f"Failed to generate HTML report: {str(report_error)}")
            return False, None

if __name__ == "__main__":
    print("=================================================")
    print("Harmonic Universe Feature Verification Script")
    print("=================================================")
    print("This script will test the backend API endpoints to verify")
    print("that features and CRUD operations are fully implemented.")
    print("\nNote on Frontend Verification:")
    print("Frontend verification would require a browser automation tool like")
    print("Cypress or Playwright. The script notes where frontend features")
    print("should be verified manually or with a dedicated UI testing tool.")
    print("=================================================\n")

    tester = HarmonicUniverseTester()
    success, report_path = tester.run_all_tests()

    if success:
        print("\n✅ All tests passed! The checked features appear to be implemented correctly.")
    else:
        print("\n❌ Some tests failed. Please check the HTML report for detailed information.")

    print("\nOpen the HTML report to view detailed test results.")
