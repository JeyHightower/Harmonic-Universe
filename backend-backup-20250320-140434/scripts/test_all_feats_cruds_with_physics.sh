#!/bin/bash

# test_all_feats_cruds_with_physics.sh
# Comprehensive test script for all features and CRUD operations including physics parameters

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Base URL for API
BASE_URL="http://localhost:5000/api"

# Test data
TEST_EMAIL="test@example.com"
TEST_PASSWORD="testpassword123"
TEST_USERNAME="testuser"

echo "Starting comprehensive feature and CRUD tests including physics parameters..."

# Helper function for HTTP requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_header=$4

    if [ -n "$data" ]; then
        if [ -n "$auth_header" ]; then
            curl -s -X "$method" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $auth_header" \
                -d "$data" \
                "${BASE_URL}${endpoint}"
        else
            curl -s -X "$method" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "${BASE_URL}${endpoint}"
        fi
    else
        if [ -n "$auth_header" ]; then
            curl -s -X "$method" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $auth_header" \
                "${BASE_URL}${endpoint}"
        else
            curl -s -X "$method" \
                -H "Content-Type: application/json" \
                "${BASE_URL}${endpoint}"
        fi
    fi
}

# 1. Authentication Tests
echo -e "\n${GREEN}Testing Authentication System...${NC}"

# Register
REGISTER_RESPONSE=$(make_request "POST" "/auth/register" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"username\":\"$TEST_USERNAME\"}")
echo "Register Response: $REGISTER_RESPONSE"

# Login
LOGIN_RESPONSE=$(make_request "POST" "/auth/login" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
echo "Login Response: $LOGIN_RESPONSE"

# 2. Scene Tests
echo -e "\n${GREEN}Testing Scene Management...${NC}"

# Create Scene
SCENE_DATA="{\"name\":\"Test Scene\",\"universe_id\":\"$UNIVERSE_ID\"}"
SCENE_RESPONSE=$(make_request "POST" "/scenes" "$SCENE_DATA" "$ACCESS_TOKEN")
SCENE_ID=$(echo $SCENE_RESPONSE | jq -r '.id')
echo "Create Scene Response: $SCENE_RESPONSE"

# 3. Physics Parameters Tests
echo -e "\n${GREEN}Testing Physics Parameters...${NC}"

# Create Physics Parameter
PHYSICS_PARAMS_DATA="{\"scene_id\":\"$SCENE_ID\",\"gravity\":{\"x\":0,\"y\":-9.81,\"z\":0},\"air_resistance\":0.1}"
PHYSICS_PARAMS_RESPONSE=$(make_request "POST" "/scenes/$SCENE_ID/physics_parameters" "$PHYSICS_PARAMS_DATA" "$ACCESS_TOKEN")
PHYSICS_PARAMS_ID=$(echo $PHYSICS_PARAMS_RESPONSE | jq -r '.id')
echo "Create Physics Parameters Response: $PHYSICS_PARAMS_RESPONSE"

# Get Physics Parameters
GET_PHYSICS_PARAMS_RESPONSE=$(make_request "GET" "/scenes/$SCENE_ID/physics_parameters/$PHYSICS_PARAMS_ID" "" "$ACCESS_TOKEN")
echo "Get Physics Parameters Response: $GET_PHYSICS_PARAMS_RESPONSE"

# Update Physics Parameters
UPDATE_PHYSICS_PARAMS_RESPONSE=$(make_request "PUT" "/scenes/$SCENE_ID/physics_parameters/$PHYSICS_PARAMS_ID" "{\"gravity\":{\"x\":0,\"y\":-10,\"z\":0}}" "$ACCESS_TOKEN")
echo "Update Physics Parameters Response: $UPDATE_PHYSICS_PARAMS_RESPONSE"

# Delete Physics Parameters
DELETE_PHYSICS_PARAMS_RESPONSE=$(make_request "DELETE" "/scenes/$SCENE_ID/physics_parameters/$PHYSICS_PARAMS_ID" "" "$ACCESS_TOKEN")
echo "Delete Physics Parameters Response: $DELETE_PHYSICS_PARAMS_RESPONSE"

# Cleanup Tests
echo -e "\n${GREEN}Running Cleanup Tests...${NC}"

# Delete Scene
DELETE_SCENE_RESPONSE=$(make_request "DELETE" "/scenes/$SCENE_ID" "" "$ACCESS_TOKEN")
echo "Delete Scene Response: $DELETE_SCENE_RESPONSE"

# Logout
LOGOUT_RESPONSE=$(make_request "POST" "/auth/logout" "" "$ACCESS_TOKEN")
echo "Logout Response: $LOGOUT_RESPONSE"

echo -e "\n${GREEN}All tests completed!${NC}"
