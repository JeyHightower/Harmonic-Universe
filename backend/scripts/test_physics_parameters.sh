#!/bin/bash

# test_physics_parameters.sh
# Test script for physics parameters CRUD operations

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Base URL for API
BASE_URL="http://localhost:5000/api/v1"
ENDPOINT="/physics-parameters"

# Test data
TEST_UNIVERSE_ID="test-universe-123"
TEST_NAME="Test Physics Config"
TEST_DESCRIPTION="Test physics configuration for automated testing"

echo -e "${YELLOW}Starting Physics Parameters API Tests...${NC}\n"

# Login and get token (using demo account)
echo -e "Logging in to get auth token..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/demo-login")
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to get auth token${NC}"
    exit 1
fi

echo -e "${GREEN}Successfully obtained auth token${NC}\n"

# Test 1: Create Physics Parameters
echo -e "Test 1: Creating new physics parameters..."
CREATE_RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"${TEST_NAME}\",
        \"description\": \"${TEST_DESCRIPTION}\",
        \"universe_id\": \"${TEST_UNIVERSE_ID}\",
        \"gravity\": 9.81,
        \"time_scale\": 1.0,
        \"air_resistance\": 0.1
    }" \
    "${BASE_URL}${ENDPOINT}")

PARAMS_ID=$(echo $CREATE_RESPONSE | jq -r '.id')

if [ -z "$PARAMS_ID" ] || [ "$PARAMS_ID" == "null" ]; then
    echo -e "${RED}Failed to create physics parameters${NC}"
    echo $CREATE_RESPONSE
    exit 1
fi

echo -e "${GREEN}Successfully created physics parameters with ID: ${PARAMS_ID}${NC}\n"

# Test 2: Get Physics Parameters
echo -e "Test 2: Fetching physics parameters..."
GET_RESPONSE=$(curl -s -X GET \
    -H "Authorization: Bearer ${TOKEN}" \
    "${BASE_URL}${ENDPOINT}/${PARAMS_ID}")

if [ "$(echo $GET_RESPONSE | jq -r '.id')" != "$PARAMS_ID" ]; then
    echo -e "${RED}Failed to fetch physics parameters${NC}"
    echo $GET_RESPONSE
    exit 1
fi

echo -e "${GREEN}Successfully fetched physics parameters${NC}\n"

# Test 3: Update Physics Parameters
echo -e "Test 3: Updating physics parameters..."
UPDATE_RESPONSE=$(curl -s -X PUT \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
        \"gravity\": 8.0,
        \"time_scale\": 1.5,
        \"description\": \"Updated test configuration\"
    }" \
    "${BASE_URL}${ENDPOINT}/${PARAMS_ID}")

if [ "$(echo $UPDATE_RESPONSE | jq -r '.gravity')" != "8.0" ]; then
    echo -e "${RED}Failed to update physics parameters${NC}"
    echo $UPDATE_RESPONSE
    exit 1
fi

echo -e "${GREEN}Successfully updated physics parameters${NC}\n"

# Test 4: List Universe Parameters
echo -e "Test 4: Listing universe parameters..."
LIST_RESPONSE=$(curl -s -X GET \
    -H "Authorization: Bearer ${TOKEN}" \
    "${BASE_URL}${ENDPOINT}/universe/${TEST_UNIVERSE_ID}")

if [ "$(echo $LIST_RESPONSE | jq 'length')" -lt 1 ]; then
    echo -e "${RED}Failed to list universe parameters${NC}"
    echo $LIST_RESPONSE
    exit 1
fi

echo -e "${GREEN}Successfully listed universe parameters${NC}\n"

# Test 5: Validate Parameters
echo -e "Test 5: Validating parameters..."
VALIDATE_RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"${TEST_NAME}\",
        \"universe_id\": \"${TEST_UNIVERSE_ID}\",
        \"gravity\": 50,
        \"time_scale\": 2.0,
        \"air_resistance\": 0.5
    }" \
    "${BASE_URL}${ENDPOINT}/validate")

if [ "$(echo $VALIDATE_RESPONSE | jq -r '.valid')" != "true" ]; then
    echo -e "${RED}Parameter validation failed${NC}"
    echo $VALIDATE_RESPONSE
    exit 1
fi

echo -e "${GREEN}Successfully validated parameters${NC}\n"

# Test 6: Delete Physics Parameters
echo -e "Test 6: Deleting physics parameters..."
DELETE_RESPONSE=$(curl -s -X DELETE \
    -H "Authorization: Bearer ${TOKEN}" \
    "${BASE_URL}${ENDPOINT}/${PARAMS_ID}")

if [ "$(echo $DELETE_RESPONSE | jq -r '.message')" != "Physics parameters deleted successfully" ]; then
    echo -e "${RED}Failed to delete physics parameters${NC}"
    echo $DELETE_RESPONSE
    exit 1
fi

echo -e "${GREEN}Successfully deleted physics parameters${NC}\n"

# Final Summary
echo -e "${GREEN}All physics parameters tests completed successfully!${NC}"
