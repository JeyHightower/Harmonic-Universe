#!/usr/bin/env python3
"""Test registration API endpoint with detailed error reporting."""

import requests
import json
import uuid
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("registration_test")

def test_registration():
    """Test the registration API endpoint with verbose logging."""
    # Generate unique username for this test
    unique_id = uuid.uuid4().hex[:8]
    username = f"testuser_{unique_id}"
    email = f"{username}@example.com"
    password = "Test123!"

    # Prepare request payload
    payload = {
        "username": username,
        "email": email,
        "password": password
    }

    logger.info(f"Attempting to register user: {username} with email: {email}")
    logger.debug(f"Request payload: {json.dumps(payload)}")

    try:
        # Make the request
        response = requests.post(
            "http://localhost:8000/api/auth/register",
            json=payload,
            headers={"Content-Type": "application/json"},
        )

        # Log response details
        logger.debug(f"Response status code: {response.status_code}")
        logger.debug(f"Response headers: {dict(response.headers)}")

        try:
            response_json = response.json()
            logger.debug(f"Response body: {json.dumps(response_json, indent=2)}")
        except json.JSONDecodeError:
            logger.debug(f"Response body (not JSON): {response.text[:500]}")

        # Check if successful
        if response.status_code == 201:
            logger.info("Registration successful!")
            logger.info(f"User ID: {response_json.get('id')}")
            return True
        else:
            logger.error(f"Registration failed with status code: {response.status_code}")
            return False

    except requests.exceptions.ConnectionError as e:
        logger.error(f"Connection error: {str(e)}")
        logger.error("Make sure the API server is running at http://localhost:8000")
        return False
    except Exception as e:
        logger.error(f"Unexpected error: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    test_registration()
