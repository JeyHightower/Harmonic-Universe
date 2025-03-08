#!/usr/bin/env python
"""
Test script to verify server functionality
"""
import os
import sys
import requests
import time
import subprocess
import signal
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_server")

def wait_for_server(port, max_attempts=10):
    """Wait for the server to start"""
    for attempt in range(max_attempts):
        try:
            resp = requests.get(f"http://localhost:{port}/health", timeout=2)
            if resp.status_code == 200:
                logger.info(f"Server is up and running on port {port}")
                return True
        except requests.RequestException:
            logger.info(f"Waiting for server to start (attempt {attempt+1}/{max_attempts})...")
            time.sleep(1)

    logger.error(f"Server did not start after {max_attempts} attempts")
    return False

def test_endpoints(port):
    """Test all required endpoints"""
    endpoints = [
        "/",
        "/health",
        "/api/health"
    ]

    success = True
    for endpoint in endpoints:
        try:
            url = f"http://localhost:{port}{endpoint}"
            logger.info(f"Testing endpoint: {url}")
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                logger.info(f"✅ {endpoint} - Status: {resp.status_code}")
            else:
                logger.error(f"❌ {endpoint} - Status: {resp.status_code}")
                success = False
        except requests.RequestException as e:
            logger.error(f"❌ {endpoint} - Error: {e}")
            success = False

    return success

def main():
    """Main function"""
    # Check if an existing server is running or start a new one
    port = int(os.environ.get("PORT", 10000))
    start_server = True

    # Check if server is already running
    try:
        resp = requests.get(f"http://localhost:{port}/health", timeout=1)
        if resp.status_code == 200:
            logger.info(f"Server already running on port {port}")
            start_server = False
    except requests.RequestException:
        logger.info(f"No existing server detected on port {port}")

    server_process = None
    if start_server:
        # Start server
        logger.info("Starting server...")
        cmd = ["python", "minimal_app.py"]
        server_process = subprocess.Popen(cmd)

        # Wait for server to start
        if not wait_for_server(port):
            logger.error("Failed to start server")
            if server_process:
                server_process.terminate()
            return 1

    # Test endpoints
    success = test_endpoints(port)

    # Clean up
    if server_process:
        logger.info("Stopping server...")
        server_process.terminate()

    if success:
        logger.info("✅ All tests passed!")
        return 0
    else:
        logger.error("❌ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
