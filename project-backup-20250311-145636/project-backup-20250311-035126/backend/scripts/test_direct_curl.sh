#!/bin/bash

# Minimal test script using direct curl commands
BASE_URL="http://localhost:8000/api"

echo "Starting direct curl test..."

# Login to get token
echo "Logging in..."
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"testpassword123"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

echo "Token obtained (not showing for security)"

if [ -z "$TOKEN" ]; then
    echo "Failed to get token. Exiting."
    exit 1
fi

# Generate a unique username
USERNAME="test_user_$(date +%s)"
echo "New username: $USERNAME"

# Update profile using direct curl command
echo "Updating profile..."
RESULT=$(curl -s -X PUT "$BASE_URL/users/me" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"username\":\"$USERNAME\"}")

echo "Update result: $RESULT"

echo "Test completed."
