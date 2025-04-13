#!/bin/bash
# api_tests.sh - Run API tests for the Harmonic Universe application
# This script tests the API endpoints using curl commands

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_URL="http://localhost:5001"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="testpassword123"
AUTH_TOKEN=""
TEST_UNIVERSE_ID=""
TEST_SCENE_ID=""
TEST_CHARACTER_ID=""

# Print with color
print_green() {
    echo -e "\e[32m$1\e[0m"
}

print_yellow() {
    echo -e "\e[33m$1\e[0m"
}

print_red() {
    echo -e "\e[31m$1\e[0m"
}

# Check if curl is installed
check_curl() {
    if ! command -v curl &> /dev/null; then
        print_red "curl is not installed. Please install curl and try again."
        exit 1
    fi
    print_green "curl is installed."
}

# Check if jq is installed (for parsing JSON responses)
check_jq() {
    if ! command -v jq &> /dev/null; then
        print_yellow "jq is not installed. Some tests may not work properly."
        print_yellow "Install jq for better testing: https://stedolan.github.io/jq/download/"
    else
        print_green "jq is installed."
    fi
}

# Check if backend server is running
check_backend() {
    print_yellow "Checking if backend server is running..."
    
    curl -s "$BACKEND_URL/api/ping" > /dev/null
    
    if [ $? -eq 0 ]; then
        print_green "Backend server is running."
    else
        print_red "Backend server is not running. Please start the server and try again."
        exit 1
    fi
}

# Register a test user
test_register() {
    print_yellow "Testing user registration..."
    
    # Delete the test user if it exists
    test_delete_user
    
    # Register a new test user
    local response=$(curl -s -X POST "$BACKEND_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"testuser\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    
    if [[ $response == *"token"* ]]; then
        print_green "User registration successful."
        if command -v jq &> /dev/null; then
            AUTH_TOKEN=$(echo $response | jq -r '.token')
        else
            AUTH_TOKEN=$(echo $response | grep -o '"token":"[^"]*' | sed 's/"token":"//')
        fi
        print_green "Authentication token received."
    else
        print_red "User registration failed."
        print_red "Response: $response"
        return 1
    fi
}

# Login with test user
test_login() {
    print_yellow "Testing user login..."
    
    local response=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    
    if [[ $response == *"token"* ]]; then
        print_green "User login successful."
        if command -v jq &> /dev/null; then
            AUTH_TOKEN=$(echo $response | jq -r '.token')
        else
            AUTH_TOKEN=$(echo $response | grep -o '"token":"[^"]*' | sed 's/"token":"//')
        fi
        print_green "Authentication token received."
    else
        print_red "User login failed."
        print_red "Response: $response"
        return 1
    fi
}

# Test creating a universe
test_create_universe() {
    print_yellow "Testing universe creation..."
    
    local response=$(curl -s -X POST "$BACKEND_URL/api/universes" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d "{\"name\":\"Test Universe\",\"description\":\"A test universe\",\"physics_parameters\":{\"gravity\":9.8,\"friction\":0.1}}")
    
    if [[ $response == *"\"name\":\"Test Universe\""* ]]; then
        print_green "Universe creation successful."
        if command -v jq &> /dev/null; then
            TEST_UNIVERSE_ID=$(echo $response | jq -r '.id')
        else
            TEST_UNIVERSE_ID=$(echo $response | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
        fi
        print_green "Universe ID: $TEST_UNIVERSE_ID"
    else
        print_red "Universe creation failed."
        print_red "Response: $response"
        return 1
    fi
}

# Test getting universes
test_get_universes() {
    print_yellow "Testing get universes..."
    
    local response=$(curl -s -X GET "$BACKEND_URL/api/universes" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    
    if [[ $response == *"universes"* ]]; then
        print_green "Get universes successful."
    else
        print_red "Get universes failed."
        print_red "Response: $response"
        return 1
    fi
}

# Test creating a scene
test_create_scene() {
    print_yellow "Testing scene creation..."
    
    if [ -z "$TEST_UNIVERSE_ID" ]; then
        print_red "Universe ID not set. Cannot create scene."
        return 1
    fi
    
    local response=$(curl -s -X POST "$BACKEND_URL/api/scenes" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d "{\"name\":\"Test Scene\",\"description\":\"A test scene\",\"universe_id\":$TEST_UNIVERSE_ID}")
    
    if [[ $response == *"\"name\":\"Test Scene\""* ]]; then
        print_green "Scene creation successful."
        if command -v jq &> /dev/null; then
            TEST_SCENE_ID=$(echo $response | jq -r '.id')
        else
            TEST_SCENE_ID=$(echo $response | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
        fi
        print_green "Scene ID: $TEST_SCENE_ID"
    else
        print_red "Scene creation failed."
        print_red "Response: $response"
        return 1
    fi
}

# Test creating a character
test_create_character() {
    print_yellow "Testing character creation..."
    
    if [ -z "$TEST_UNIVERSE_ID" ]; then
        print_red "Universe ID not set. Cannot create character."
        return 1
    fi
    
    local response=$(curl -s -X POST "$BACKEND_URL/api/characters" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d "{\"name\":\"Test Character\",\"description\":\"A test character\",\"universe_id\":$TEST_UNIVERSE_ID}")
    
    if [[ $response == *"\"name\":\"Test Character\""* ]]; then
        print_green "Character creation successful."
        if command -v jq &> /dev/null; then
            TEST_CHARACTER_ID=$(echo $response | jq -r '.id')
        else
            TEST_CHARACTER_ID=$(echo $response | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
        fi
        print_green "Character ID: $TEST_CHARACTER_ID"
    else
        print_red "Character creation failed."
        print_red "Response: $response"
        return 1
    fi
}

# Test cleanup - delete test entities
test_cleanup() {
    print_yellow "Cleaning up test data..."
    
    # Delete character if created
    if [ ! -z "$TEST_CHARACTER_ID" ]; then
        curl -s -X DELETE "$BACKEND_URL/api/characters/$TEST_CHARACTER_ID" \
            -H "Authorization: Bearer $AUTH_TOKEN" > /dev/null
        print_green "Test character deleted."
    fi
    
    # Delete scene if created
    if [ ! -z "$TEST_SCENE_ID" ]; then
        curl -s -X DELETE "$BACKEND_URL/api/scenes/$TEST_SCENE_ID" \
            -H "Authorization: Bearer $AUTH_TOKEN" > /dev/null
        print_green "Test scene deleted."
    fi
    
    # Delete universe if created
    if [ ! -z "$TEST_UNIVERSE_ID" ]; then
        curl -s -X DELETE "$BACKEND_URL/api/universes/$TEST_UNIVERSE_ID" \
            -H "Authorization: Bearer $AUTH_TOKEN" > /dev/null
        print_green "Test universe deleted."
    fi
}

# Delete the test user (for cleanup)
test_delete_user() {
    print_yellow "Deleting test user if it exists..."
    
    # First try to login
    local login_response=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    
    if [[ $login_response == *"token"* ]]; then
        local temp_token=""
        if command -v jq &> /dev/null; then
            temp_token=$(echo $login_response | jq -r '.token')
        else
            temp_token=$(echo $login_response | grep -o '"token":"[^"]*' | sed 's/"token":"//')
        fi
        
        # Delete the user
        curl -s -X DELETE "$BACKEND_URL/api/user/profile" \
            -H "Authorization: Bearer $temp_token" > /dev/null
        
        print_green "Test user deleted."
    else
        print_yellow "Test user does not exist or couldn't be logged in. Continuing."
    fi
}

# Run all tests
run_tests() {
    # Initialize error counter
    local error_count=0
    
    # Run tests - order matters here!
    test_register || ((error_count++))
    test_login || ((error_count++))
    test_create_universe || ((error_count++))
    test_get_universes || ((error_count++))
    test_create_scene || ((error_count++))
    test_create_character || ((error_count++))
    
    # Cleanup test data
    test_cleanup
    
    # Return error count
    return $error_count
}

# Main function
main() {
    print_green "==== Running API Tests ===="
    
    # Check prerequisites
    check_curl
    check_jq
    check_backend
    
    # Run all tests
    run_tests
    local test_errors=$?
    
    # Show summary
    print_green "==== API Test Summary ===="
    if [ $test_errors -eq 0 ]; then
        print_green "All API tests passed successfully!"
    else
        print_red "$test_errors API test(s) failed."
        exit 1
    fi
}

# Run main function
main 