#!/usr/bin/env python
"""
Test script to verify routes in both local and Render.com environments.
Run this script to check if all the necessary routes are working.
"""

import os
import sys
import logging
import requests
from urllib.parse import urljoin

# Configure logging
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger("test_routes")

def test_routes(base_url="http://localhost:8000"):
    """Test if all the necessary routes are working."""
    # Routes to test
    routes = [
        # Main routes
        "/",
        "/login",
        "/signup",
        "/demo",

        # API routes
        "/api/health",

        # Debug routes
        "/debug",
        "/debug-index",
        "/render-test"
    ]

    logger.info(f"Testing routes on {base_url}")

    results = []
    for route in routes:
        url = urljoin(base_url, route)
        try:
            logger.info(f"Testing route: {route}")
            response = requests.get(url, timeout=5)
            status = response.status_code
            content_length = len(response.content)
            content_type = response.headers.get('Content-Type', 'unknown')

            results.append({
                "route": route,
                "status": status,
                "content_length": content_length,
                "content_type": content_type,
                "ok": 200 <= status < 400,
            })

            if content_length == 0:
                logger.warning(f"❌ Route {route} returned empty content!")
            else:
                logger.info(f"✅ Route {route} returned {content_length} bytes of {content_type}")

        except Exception as e:
            logger.error(f"Error testing route {route}: {e}")
            results.append({
                "route": route,
                "status": 0,
                "content_length": 0,
                "content_type": "error",
                "ok": False,
                "error": str(e)
            })

    # Print summary
    logger.info("=== Route Test Summary ===")
    all_ok = True
    for result in results:
        status = "✅" if result.get("ok") else "❌"
        logger.info(f"{status} {result['route']} - Status: {result['status']}, Length: {result.get('content_length', 0)} bytes")
        if not result.get("ok"):
            all_ok = False

    if all_ok:
        logger.info("🎉 All routes are working correctly!")
    else:
        logger.warning("⚠️ Some routes failed the test!")

    return all_ok

if __name__ == "__main__":
    # Allow specifying base URL as command line argument
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"

    if base_url == "render":
        # Use the Render.com URL - replace with your actual URL
        base_url = "https://harmonic-universe.onrender.com"

    logger.info(f"Testing routes on {base_url}")
    success = test_routes(base_url)

    # Exit with appropriate code
    sys.exit(0 if success else 1)
