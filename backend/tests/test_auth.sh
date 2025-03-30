#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

# Base URL for the API
BASE_URL="http://localhost:5001/api/auth"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test description
print_test() {
    echo -e "\n${BLUE}Testing: $1${NC}"
}

# Function to check response
check_response() {
    local expected_status=$1
    local actual_status=$2
    local test_name=$3
    
    if [ "$actual_status" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ $test_name - Status: $actual_status${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ $test_name - Expected: $expected_status, Got: $actual_status${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Store auth token
AUTH_TOKEN=""

echo "Starting Authentication API Tests..."

# Test 1: Register new user
print_test "Register new user"
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/register" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "testuser",
        "email": "test@example.com",
        "password": "TestPass123!"
    }')
STATUS=${RESPONSE: -3}
BODY=${RESPONSE:0:${#RESPONSE}-3}
check_response 201 "$STATUS" "Register new user"
if [ "$STATUS" -eq 201 ]; then
    AUTH_TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi

# Test 2: Register with duplicate username
print_test "Register with duplicate username"
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/register" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "testuser",
        "email": "different@example.com",
        "password": "TestPass123!"
    }')
STATUS=${RESPONSE: -3}
check_response 409 "$STATUS" "Register with duplicate username"

# Test 3: Register with duplicate email
print_test "Register with duplicate email"
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/register" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "differentuser",
        "email": "test@example.com",
        "password": "TestPass123!"
    }')
STATUS=${RESPONSE: -3}
check_response 409 "$STATUS" "Register with duplicate email"

# Test 4: Register with missing fields
print_test "Register with missing fields"
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/register" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "testuser"
    }')
STATUS=${RESPONSE: -3}
check_response 400 "$STATUS" "Register with missing fields"

# Test 5: Login with valid credentials
print_test "Login with valid credentials"
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test@example.com",
        "password": "TestPass123!"
    }')
STATUS=${RESPONSE: -3}
BODY=${RESPONSE:0:${#RESPONSE}-3}
check_response 200 "$STATUS" "Login with valid credentials"
if [ "$STATUS" -eq 200 ]; then
    AUTH_TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi

# Test 6: Login with invalid credentials
print_test "Login with invalid credentials"
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test@example.com",
        "password": "WrongPass123!"
    }')
STATUS=${RESPONSE: -3}
check_response 401 "$STATUS" "Login with invalid credentials"

# Test 7: Login with nonexistent user
print_test "Login with nonexistent user"
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "nonexistent@example.com",
        "password": "TestPass123!"
    }')
STATUS=${RESPONSE: -3}
check_response 401 "$STATUS" "Login with nonexistent user"

# Test 8: Get current user with valid token
print_test "Get current user with valid token"
RESPONSE=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/me" \
    -H "Authorization: Bearer $AUTH_TOKEN")
STATUS=${RESPONSE: -3}
check_response 200 "$STATUS" "Get current user with valid token"

# Test 9: Get current user without token
print_test "Get current user without token"
RESPONSE=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/me")
STATUS=${RESPONSE: -3}
check_response 401 "$STATUS" "Get current user without token"

# Test 10: Demo login
print_test "Demo login"
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/demo-login")
STATUS=${RESPONSE: -3}
check_response 200 "$STATUS" "Demo login"

# Test 11: Logout with valid token
print_test "Logout with valid token"
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/logout" \
    -H "Authorization: Bearer $AUTH_TOKEN")
STATUS=${RESPONSE: -3}
check_response 200 "$STATUS" "Logout with valid token"

# Print test summary
echo -e "\nTest Summary:"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"

# Exit with status code based on test results
if [ "$TESTS_FAILED" -eq 0 ]; then
    exit 0
else
    exit 1
fi 