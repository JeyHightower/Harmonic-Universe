#!/usr/bin/env python
"""
Test script to verify the application is working correctly
"""
import requests
import sys
import time
import logging
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_endpoints():
    """Test that all required endpoints are working"""
    base_url = "http://localhost:10000"

    # Test regular endpoints
    basic_endpoints = {
        "/": {"content_type": "text/html", "expected": "Harmonic Universe"},
        "/health": {"content_type": "application/json", "expected_json": {"status": "healthy"}},
        "/api/health": {"content_type": "application/json", "expected_json": {"status": "healthy"}}
    }

    # Test legacy endpoints
    legacy_endpoints = {
        "/ping": {"content_type": "application/json", "expected_json": {"status": "healthy"}},
        "/status": {"content_type": "application/json", "expected_json": {"status": "healthy"}},
        "/healthcheck": {"content_type": "application/json", "expected_json": {"status": "healthy"}},
        "/api/ping": {"content_type": "application/json", "expected_json": {"status": "healthy"}},
        "/api/status": {"content_type": "application/json", "expected_json": {"status": "healthy"}},
        "/api/healthcheck": {"content_type": "application/json", "expected_json": {"status": "healthy"}}
    }

    # Combine both endpoint types
    all_endpoints = {**basic_endpoints, **legacy_endpoints}

    success = True
    for endpoint, expected in all_endpoints.items():
        try:
            url = f"{base_url}{endpoint}"
            logger.info(f"Testing endpoint: {url}")

            response = requests.get(url, timeout=5)

            if response.status_code == 200:
                logger.info(f"✅ {endpoint} returned status 200")
            else:
                logger.error(f"❌ {endpoint} returned status {response.status_code}")
                success = False
                continue

            # For text content
            if "expected" in expected:
                if expected["expected"] in response.text:
                    logger.info(f"✅ {endpoint} contains expected content")
                else:
                    logger.error(f"❌ {endpoint} missing expected content: {expected['expected']}")
                    logger.error(f"Actual content: {response.text[:100]}...")
                    success = False

            # For JSON content
            if "expected_json" in expected:
                try:
                    json_response = response.json()
                    expected_json = expected["expected_json"]

                    # Check if all expected keys and values are in the response
                    missing_keys = []
                    for key, value in expected_json.items():
                        if key not in json_response:
                            missing_keys.append(key)
                        elif json_response[key] != value:
                            logger.error(f"❌ {endpoint} JSON key '{key}' has wrong value. Expected: {value}, Got: {json_response[key]}")
                            success = False

                    if missing_keys:
                        logger.error(f"❌ {endpoint} JSON missing keys: {missing_keys}")
                        success = False
                    else:
                        logger.info(f"✅ {endpoint} contains expected JSON")

                except ValueError:
                    logger.error(f"❌ {endpoint} returned invalid JSON: {response.text[:100]}...")
                    success = False

        except Exception as e:
            logger.error(f"❌ Error testing {endpoint}: {e}")
            success = False

    return success

def main():
    """Main function"""
    logger.info("Testing application endpoints...")
    success = test_endpoints()

    if success:
        logger.info("✅ All tests passed!")
        return 0
    else:
        logger.error("❌ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
