#!/bin/bash

# Minimal test script for profile update
BASE_URL="http://localhost:8000/api"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="testpassword123"
NEW_USERNAME="test_user_$(date +%s)"

echo "Starting minimal profile update test..."
echo "New username will be: $NEW_USERNAME"

# Login to get token
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

echo "Login response: $LOGIN_RESPONSE"

# Extract token
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
echo "Token: $ACCESS_TOKEN"

if [ -z "$ACCESS_TOKEN" ]; then
    echo "Failed to get access token. Exiting."
    exit 1
fi

# Update profile
echo "Updating profile..."
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/users/me" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d "{\"username\":\"$NEW_USERNAME\"}")

echo "Update response: $UPDATE_RESPONSE"

# Try with single quotes and variable interpolation
echo "Trying alternative JSON format..."
UPDATE_RESPONSE2=$(curl -s -X PUT "$BASE_URL/users/me" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d '{"username":"'"$NEW_USERNAME"'"}')

echo "Update response (alternative): $UPDATE_RESPONSE2"

echo "Test completed."
