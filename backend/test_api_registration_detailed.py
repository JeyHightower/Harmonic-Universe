#!/usr/bin/env python3
"""Detailed test for API registration endpoint with error handling."""

import requests
import json
import uuid
import logging
import sys
import time

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("registration_test")

def test_registration_detailed():
    """Test the registration API endpoint with detailed error handling."""
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
        # Make the request with detailed error handling
        response = requests.post(
            "http://localhost:8000/api/auth/register",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )

        # Log response details
        logger.debug(f"Response status code: {response.status_code}")
        logger.debug(f"Response headers: {dict(response.headers)}")

        try:
            response_json = response.json()
            logger.debug(f"Response body: {json.dumps(response_json, indent=2)}")

            # Check for specific error codes
            if response.status_code != 201:
                error_code = response_json.get('error_code', 'UNKNOWN_ERROR')
                error_message = response_json.get('message', 'Unknown error')
                error_details = response_json.get('details', {})

                logger.error(f"Registration failed with error code: {error_code}")
                logger.error(f"Error message: {error_message}")

                if error_details:
                    logger.error(f"Error details: {json.dumps(error_details, indent=2)}")

                # Try to diagnose common issues
                if error_code == "VALIDATION_ERROR":
                    logger.info("Validation error detected. Checking for common issues...")

                    # Test if server is properly handling the request format
                    logger.info("Testing if server is properly handling JSON format...")
                    alt_response = requests.post(
                        "http://localhost:8000/api/auth/register",
                        data=json.dumps(payload),
                        headers={"Content-Type": "application/json"},
                        timeout=10
                    )
                    logger.debug(f"Alternative request status: {alt_response.status_code}")

                    # Test with different content type
                    logger.info("Testing with explicit charset in content type...")
                    alt_response2 = requests.post(
                        "http://localhost:8000/api/auth/register",
                        json=payload,
                        headers={"Content-Type": "application/json; charset=utf-8"},
                        timeout=10
                    )
                    logger.debug(f"Alternative request with charset status: {alt_response2.status_code}")

                    # Test with form data instead of JSON
                    logger.info("Testing with form data instead of JSON...")
                    form_response = requests.post(
                        "http://localhost:8000/api/auth/register",
                        data=payload,
                        timeout=10
                    )
                    logger.debug(f"Form data request status: {form_response.status_code}")

                return False
        except json.JSONDecodeError:
            logger.debug(f"Response body (not JSON): {response.text[:500]}")
            logger.error("Response was not valid JSON")
            return False

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
    except requests.exceptions.Timeout:
        logger.error("Request timed out. Server might be overloaded or not responding.")
        return False
    except Exception as e:
        logger.error(f"Unexpected error: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    test_registration_detailed()
