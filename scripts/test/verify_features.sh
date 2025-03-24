#!/bin/bash

# Harmonic Universe Feature Verification Script
# This script tests both backend and frontend features
# to verify the implementation of features and CRUD operations

set -e  # Exit on error

BOLD=$(tput bold)
NORMAL=$(tput sgr0)
GREEN=$(tput setaf 2)
RED=$(tput setaf 1)
YELLOW=$(tput setaf 3)

REPORTS_DIR="test_reports"
PORT=8000
API_URL="http://localhost:${PORT}/api"
FRONTEND_URL="http://localhost:${PORT}"
MOCK_SERVER_PID=""
MOCK_SERVER_PORT=8001
MOCK_MODE=false

# Function to open file in default browser
open_browser() {
  local file=$1
  echo "${BOLD}Opening HTML report in browser...${NORMAL}"

  # Try to detect the operating system and use the appropriate command
  case "$(uname -s)" in
    Darwin*)  # macOS
      open "$file"
      ;;
    Linux*)   # Linux
      if command -v xdg-open > /dev/null; then
        xdg-open "$file"
      elif command -v gnome-open > /dev/null; then
        gnome-open "$file"
      else
        echo "${YELLOW}Could not automatically open the browser. Please open $file manually.${NORMAL}"
      fi
      ;;
    CYGWIN*|MINGW*|MSYS*)  # Windows
      start "$file"
      ;;
    *)
      echo "${YELLOW}Could not automatically open the browser. Please open $file manually.${NORMAL}"
      ;;
  esac
}

# Function to check service availability
check_service() {
  local url=$1
  local name=$2
  echo "${BOLD}Checking if ${name} is running at ${url}...${NORMAL}"

  if curl -s --connect-timeout 5 "${url}" > /dev/null; then
    echo "${GREEN}✓ ${name} is available at ${url}${NORMAL}"
    return 0
  else
    echo "${RED}✗ ${name} is not available at ${url}${NORMAL}"
    return 1
  fi
}

# Function to start a mock server for testing
start_mock_server() {
  echo "${BOLD}Starting mock server for testing...${NORMAL}"

  # Create a temporary Python file for our mock server
  MOCK_SERVER_FILE=$(mktemp)
  cat > "$MOCK_SERVER_FILE" << 'EOF'
import http.server
import socketserver
import json
import threading
import time
import os
import sys

mock_port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
print(f"Starting mock server on port {mock_port}")

# Create mock data
mock_data = {
    "/api/health": {"status": "ok"},
    "/health": {"status": "ok"},
    "/api/auth/register": {"id": "mock-user-123", "email": "test@example.com", "username": "testuser"},
    "/api/auth/login": {"access_token": "mock-token-123", "refresh_token": "mock-refresh-123"},
    "/api/auth/refresh": {"access_token": "mock-token-new-123"},
    "/api/users/me": {"id": "mock-user-123", "email": "test@example.com", "username": "testuser"},
    "/api/universe/": [{"id": "mock-universe-123", "name": "Test Universe", "description": "Test description"}],
    "/api/scenes/": [{"id": "mock-scene-123", "name": "Test Scene", "description": "Test description"}],
    "/api/physics-parameters/": [{"id": "mock-params-123", "name": "Test Parameters", "gravity": 9.8}],
    "/api/audio/tracks": [{"id": "mock-audio-123", "name": "Test Audio", "scene_id": "mock-scene-123"}]
}

class MockServer(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path in mock_data or self.path.startswith("/api/universe/") or self.path.startswith("/api/scenes/"):
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()

            if self.path in mock_data:
                response_data = mock_data[self.path]
            else:
                # Handle paths with IDs
                response_data = {"id": "mock-123", "name": "Mock Item", "description": "Mock description"}

            self.wfile.write(json.dumps(response_data).encode())
        elif self.path == "/":
            # Serve a basic HTML page for frontend checks
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(b"<html><body><h1>Mock Frontend</h1></body></html>")
        elif self.path.endswith(".html"):
            # For HTML pages like /login.html
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(b"<html><body><h1>Mock Page</h1></body></html>")
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        self.send_response(201)  # Created
        self.send_header('Content-Type', 'application/json')
        self.end_headers()

        if self.path == "/api/auth/register":
            self.wfile.write(json.dumps(mock_data["/api/auth/register"]).encode())
        elif self.path == "/api/auth/login":
            self.wfile.write(json.dumps(mock_data["/api/auth/login"]).encode())
        else:
            # Default response for other POST endpoints
            self.wfile.write(json.dumps({"id": "mock-123", "created": True}).encode())

    def do_PUT(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"id": "mock-123", "updated": True}).encode())

    def do_DELETE(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"deleted": True}).encode())

    def log_message(self, format, *args):
        # Suppress log messages to keep terminal clean
        return

# Start the mock server
with socketserver.TCPServer(("", mock_port), MockServer) as httpd:
    print(f"Mock server running at http://localhost:{mock_port}")
    httpd.serve_forever()
EOF

  # Start the mock server in the background
  python "$MOCK_SERVER_FILE" "$MOCK_SERVER_PORT" &
  MOCK_SERVER_PID=$!

  # Wait for the server to start
  echo "Waiting for mock server to start..."
  sleep 2

  # Check if the server is running
  if ! curl -s "http://localhost:${MOCK_SERVER_PORT}/health" > /dev/null; then
    echo "${RED}Failed to start mock server${NORMAL}"
    return 1
  fi

  echo "${GREEN}Mock server started with PID ${MOCK_SERVER_PID}${NORMAL}"
  return 0
}

# Function to stop the mock server
stop_mock_server() {
  if [ -n "$MOCK_SERVER_PID" ]; then
    echo "${BOLD}Stopping mock server (PID ${MOCK_SERVER_PID})...${NORMAL}"
    kill $MOCK_SERVER_PID 2>/dev/null || true
  fi
}

# Clean up on exit
trap stop_mock_server EXIT

echo "${BOLD}========================================================="
echo "Harmonic Universe Feature Verification"
echo "=========================================================${NORMAL}"

# Create reports directory if it doesn't exist
mkdir -p "$REPORTS_DIR"

# Check if the environment is running
SERVICE_AVAILABLE=true

if ! check_service "${API_URL}/health" "API service"; then
  SERVICE_AVAILABLE=false
  echo
  echo "${YELLOW}The API service doesn't appear to be running. This script will"
  echo "continue but tests may fail. To run the service:${NORMAL}"
  echo "  1. Start your API server at port ${PORT}"
  echo "  2. Make sure it exposes a health endpoint at ${API_URL}/health"
  echo
fi

if ! check_service "${FRONTEND_URL}" "Frontend service"; then
  SERVICE_AVAILABLE=false
  echo
  echo "${YELLOW}The Frontend service doesn't appear to be running. This script will"
  echo "continue but frontend checks may fail. To run the service:${NORMAL}"
  echo "  1. Start your frontend server at ${PORT}"
  echo
fi

if [ "$SERVICE_AVAILABLE" = false ]; then
  echo "${YELLOW}Do you want to:"
  echo "  1) Continue anyway (tests will likely fail)"
  echo "  2) Run in mock mode (uses a temporary mock server for testing)"
  echo "  3) Cancel verification"
  echo -n "Enter your choice (1/2/3): ${NORMAL}"
  read -r answer

  if [ "$answer" = "2" ]; then
    # Start the mock server
    if start_mock_server; then
      MOCK_MODE=true
      # Update the API URL to point to the mock server
      API_URL="http://localhost:${MOCK_SERVER_PORT}/api"
      FRONTEND_URL="http://localhost:${MOCK_SERVER_PORT}"
      echo "${GREEN}Using mock server at http://localhost:${MOCK_SERVER_PORT}${NORMAL}"
    else
      echo "${RED}Failed to start mock server. Exiting.${NORMAL}"
      exit 1
    fi
  elif [ "$answer" = "3" ]; then
    echo "${RED}Verification canceled.${NORMAL}"
    exit 1
  else
    echo "${YELLOW}Continuing with verification (tests may fail)...${NORMAL}"
  fi

  echo
fi

# Install required Python dependencies
echo "${BOLD}Installing required Python dependencies...${NORMAL}"
pip install requests uuid

# Run backend API tests
echo "${BOLD}Running backend API tests...${NORMAL}"
if [ "$MOCK_MODE" = true ]; then
  # When in mock mode, use the mock server URL
  python feature_verification.py --base-url "http://localhost:${MOCK_SERVER_PORT}/api"
else
  python feature_verification.py
fi

# Find the most recent HTML report
LATEST_REPORT=$(find "$REPORTS_DIR" -name "test_report_*.html" -type f -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -n 1)

# Open the HTML report in the default browser
if [ -n "$LATEST_REPORT" ]; then
  echo "${BOLD}Found report: ${NORMAL}$LATEST_REPORT"
  open_browser "$LATEST_REPORT"
else
  echo "${YELLOW}No HTML report file found${NORMAL}"
fi

# Basic frontend verification (headless browser checks)
echo "${BOLD}===========================================================${NORMAL}"
echo "${BOLD}Frontend Feature Verification${NORMAL}"
echo "${BOLD}===========================================================${NORMAL}"
echo "${YELLOW}Note: For comprehensive frontend testing, a UI testing tool like Cypress"
echo "or Playwright should be used.${NORMAL}"
echo

# Check basic frontend pages
echo "${BOLD}Checking basic frontend pages...${NORMAL}"

check_url() {
  local url=$1
  local name=$2
  echo -n "  - Checking ${name} page... "
  if curl -s --connect-timeout 3 "$url" | grep -q "<html"; then
    echo "${GREEN}OK${NORMAL}"
    return 0
  else
    echo "${RED}FAILED${NORMAL}"
    return 1
  fi
}

# Check basic pages
if [ "$SERVICE_AVAILABLE" = true ] || [ "$MOCK_MODE" = true ]; then
  check_url "${FRONTEND_URL}" "Home"
  check_url "${FRONTEND_URL}/login" "Login"
  check_url "${FRONTEND_URL}/register" "Register"
  check_url "${FRONTEND_URL}/dashboard" "Dashboard"
  check_url "${FRONTEND_URL}/universe" "Universe"
else
  echo "${YELLOW}Skipping frontend checks as service is not available${NORMAL}"
fi

echo
echo "${BOLD}===========================================================${NORMAL}"
echo "${BOLD}Feature Verification Summary${NORMAL}"
echo "${BOLD}===========================================================${NORMAL}"
if [ "$MOCK_MODE" = true ]; then
  echo "${YELLOW}Tests were run in MOCK MODE using a simulated server"
  echo "These results are for verification script testing only and do not"
  echo "represent actual API functionality.${NORMAL}"
  echo
fi
echo "Backend API tests: See above for detailed results"
echo "Frontend basic checks: Completed"
echo
echo "${YELLOW}For comprehensive frontend testing, manual verification or a UI testing"
echo "framework like Cypress or Playwright should be used to verify each feature.${NORMAL}"
echo
echo "The following features should be manually verified in the frontend:"
echo "- User authentication (login, register, profile management)"
echo "- Universe management (create, view, update, delete)"
echo "- Scene management (create, view, update, delete, reorder)"
echo "- Physics parameters configuration"
echo "- Audio generation and playback"
echo
echo "${BOLD}${GREEN}Feature verification completed!${NORMAL}"
echo
echo "${BOLD}For detailed results, view the HTML report that was opened in your browser.${NORMAL}"
if [ -n "$LATEST_REPORT" ]; then
  echo "${BOLD}Report file: ${NORMAL}$LATEST_REPORT"
fi
