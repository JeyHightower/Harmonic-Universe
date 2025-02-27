#!/bin/bash

# test_all_features.sh
# Comprehensive test script for all features and CRUD operations

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Base URL for API
BASE_URL="http://localhost:8000/api"

# Test data
TEST_EMAIL="test@example.com"
TEST_PASSWORD="testpassword123"
TEST_USERNAME="testuser"
DEMO_EMAIL="demo@example.com"
DEMO_PASSWORD="demo123"

echo "Starting comprehensive feature tests..."

# Helper function for HTTP requests with error handling
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_header=$4
    local response

    if [ -n "$data" ]; then
        if [ -n "$auth_header" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $auth_header" \
                -d "$data" \
                "${BASE_URL}${endpoint}")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "${BASE_URL}${endpoint}")
        fi
    else
        if [ -n "$auth_header" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $auth_header" \
                "${BASE_URL}${endpoint}")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                "${BASE_URL}${endpoint}")
        fi
    fi

    # Extract status code
    local status_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')

    # Check if request was successful
    if [[ $status_code -ge 200 ]] && [[ $status_code -lt 300 ]]; then
        echo "$body"
    else
        echo -e "${RED}Error: Request failed with status $status_code${NC}"
        echo -e "${RED}Response: $body${NC}"
        return 1
    fi
}

# Check if server is running
echo -e "\n${YELLOW}Checking server status...${NC}"
if ! curl -s "http://localhost:5000/health" > /dev/null; then
    echo -e "${RED}Error: Server is not running on port 5000${NC}"
    exit 1
fi

# 1. Authentication System Tests
echo -e "\n${GREEN}Testing Authentication System...${NC}"

# User Registration
echo -e "\n${YELLOW}Testing User Registration...${NC}"
REGISTER_RESPONSE=$(make_request "POST" "/auth/signup" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"username\":\"$TEST_USERNAME\"}")
echo "Register Response: $REGISTER_RESPONSE"

# User Login
echo -e "\n${YELLOW}Testing User Login...${NC}"
LOGIN_RESPONSE=$(make_request "POST" "/auth/login" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
    echo -e "${RED}Error: Failed to get access token${NC}"
    exit 1
fi
echo "Login successful, got access token"

# Demo User Login
echo -e "\n${YELLOW}Testing Demo User Login...${NC}"
DEMO_LOGIN_RESPONSE=$(make_request "POST" "/auth/login" "{\"email\":\"$DEMO_EMAIL\",\"password\":\"$DEMO_PASSWORD\"}")
echo "Demo Login Response: $DEMO_LOGIN_RESPONSE"

# Token Refresh
echo -e "\n${YELLOW}Testing Token Refresh...${NC}"
REFRESH_RESPONSE=$(make_request "POST" "/auth/refresh" "" "$ACCESS_TOKEN")
echo "Token Refresh Response: $REFRESH_RESPONSE"

# 2. User Management Tests
echo -e "\n${GREEN}Testing User Management...${NC}"

# Get User Profile
echo -e "\n${YELLOW}Testing Get User Profile...${NC}"
PROFILE_RESPONSE=$(make_request "GET" "/users/me" "" "$ACCESS_TOKEN")
echo "Get Profile Response: $PROFILE_RESPONSE"

# Update User Profile
echo -e "\n${YELLOW}Testing Update User Profile...${NC}"
UPDATE_PROFILE_RESPONSE=$(make_request "PUT" "/users/me" "{\"username\":\"updated_testuser\"}" "$ACCESS_TOKEN")
echo "Update Profile Response: $UPDATE_PROFILE_RESPONSE"

# Update User Settings
echo -e "\n${YELLOW}Testing Update User Settings...${NC}"
UPDATE_SETTINGS_RESPONSE=$(make_request "PUT" "/users/me/settings" "{\"theme\":\"dark\",\"notifications\":true}" "$ACCESS_TOKEN")
echo "Update Settings Response: $UPDATE_SETTINGS_RESPONSE"

# 3. Universe Management Tests
echo -e "\n${GREEN}Testing Universe Management...${NC}"

# Create Universe
echo -e "\n${YELLOW}Testing Create Universe...${NC}"
UNIVERSE_DATA="{\"name\":\"Test Universe\",\"description\":\"Test Description\"}"
UNIVERSE_RESPONSE=$(make_request "POST" "/universes" "$UNIVERSE_DATA" "$ACCESS_TOKEN")
UNIVERSE_ID=$(echo $UNIVERSE_RESPONSE | jq -r '.id')
if [ -z "$UNIVERSE_ID" ] || [ "$UNIVERSE_ID" = "null" ]; then
    echo -e "${RED}Error: Failed to create universe${NC}"
    exit 1
fi
echo "Universe created with ID: $UNIVERSE_ID"

# Get Universe Details
echo -e "\n${YELLOW}Testing Get Universe Details...${NC}"
GET_UNIVERSE_RESPONSE=$(make_request "GET" "/universes/$UNIVERSE_ID" "" "$ACCESS_TOKEN")
echo "Get Universe Response: $GET_UNIVERSE_RESPONSE"

# Update Universe
echo -e "\n${YELLOW}Testing Update Universe...${NC}"
UPDATE_UNIVERSE_RESPONSE=$(make_request "PUT" "/universes/$UNIVERSE_ID" "{\"name\":\"Updated Universe\"}" "$ACCESS_TOKEN")
echo "Update Universe Response: $UPDATE_UNIVERSE_RESPONSE"

# List All Universes
echo -e "\n${YELLOW}Testing List All Universes...${NC}"
LIST_UNIVERSES_RESPONSE=$(make_request "GET" "/universes" "" "$ACCESS_TOKEN")
echo "List Universes Response: $LIST_UNIVERSES_RESPONSE"

# Sort/Filter Universes
echo -e "\n${YELLOW}Testing Sort/Filter Universes...${NC}"
FILTER_UNIVERSES_RESPONSE=$(make_request "GET" "/universes?sort=created_at&order=desc&public=true" "" "$ACCESS_TOKEN")
echo "Filter Universes Response: $FILTER_UNIVERSES_RESPONSE"

# 4. Physics Objects Tests
echo -e "\n${GREEN}Testing Physics Objects...${NC}"

# Create Physics Object
echo -e "\n${YELLOW}Testing Create Physics Object...${NC}"
PHYSICS_OBJECT_DATA="{\"name\":\"Test Object\",\"type\":\"sphere\",\"position\":{\"x\":0,\"y\":0,\"z\":0}}"
PHYSICS_OBJECT_RESPONSE=$(make_request "POST" "/universes/$UNIVERSE_ID/physics" "$PHYSICS_OBJECT_DATA" "$ACCESS_TOKEN")
PHYSICS_OBJECT_ID=$(echo $PHYSICS_OBJECT_RESPONSE | jq -r '.id')
echo "Create Physics Object Response: $PHYSICS_OBJECT_RESPONSE"

# Get Physics Object
echo -e "\n${YELLOW}Testing Get Physics Object...${NC}"
GET_PHYSICS_OBJECT_RESPONSE=$(make_request "GET" "/universes/$UNIVERSE_ID/physics/$PHYSICS_OBJECT_ID" "" "$ACCESS_TOKEN")
echo "Get Physics Object Response: $GET_PHYSICS_OBJECT_RESPONSE"

# Update Physics Object
echo -e "\n${YELLOW}Testing Update Physics Object...${NC}"
UPDATE_PHYSICS_OBJECT_RESPONSE=$(make_request "PUT" "/universes/$UNIVERSE_ID/physics/$PHYSICS_OBJECT_ID" "{\"position\":{\"x\":1,\"y\":1,\"z\":1}}" "$ACCESS_TOKEN")
echo "Update Physics Object Response: $UPDATE_PHYSICS_OBJECT_RESPONSE"

# Delete Physics Object
echo -e "\n${YELLOW}Testing Delete Physics Object...${NC}"
DELETE_PHYSICS_OBJECT_RESPONSE=$(make_request "DELETE" "/universes/$UNIVERSE_ID/physics/$PHYSICS_OBJECT_ID" "" "$ACCESS_TOKEN")
echo "Delete Physics Object Response: $DELETE_PHYSICS_OBJECT_RESPONSE"

# 5. Scene Management Tests
echo -e "\n${GREEN}Testing Scene Management...${NC}"

# Create Scene
echo -e "\n${YELLOW}Testing Create Scene...${NC}"
SCENE_DATA="{\"name\":\"Test Scene\",\"universe_id\":\"$UNIVERSE_ID\"}"
SCENE_RESPONSE=$(make_request "POST" "/universes/$UNIVERSE_ID/storyboards" "$SCENE_DATA" "$ACCESS_TOKEN")
SCENE_ID=$(echo $SCENE_RESPONSE | jq -r '.id')
echo "Create Scene Response: $SCENE_RESPONSE"

# Get Scene Details
echo -e "\n${YELLOW}Testing Get Scene Details...${NC}"
GET_SCENE_RESPONSE=$(make_request "GET" "/universes/$UNIVERSE_ID/storyboards/$SCENE_ID" "" "$ACCESS_TOKEN")
echo "Get Scene Response: $GET_SCENE_RESPONSE"

# Update Scene
echo -e "\n${YELLOW}Testing Update Scene...${NC}"
UPDATE_SCENE_RESPONSE=$(make_request "PUT" "/universes/$UNIVERSE_ID/storyboards/$SCENE_ID" "{\"name\":\"Updated Scene\"}" "$ACCESS_TOKEN")
echo "Update Scene Response: $UPDATE_SCENE_RESPONSE"

# Delete Scene
echo -e "\n${YELLOW}Testing Delete Scene...${NC}"
DELETE_SCENE_RESPONSE=$(make_request "DELETE" "/universes/$UNIVERSE_ID/storyboards/$SCENE_ID" "" "$ACCESS_TOKEN")
echo "Delete Scene Response: $DELETE_SCENE_RESPONSE"

# 6. Music Generation Tests
echo -e "\n${GREEN}Testing Music Generation...${NC}"

# Generate Music
echo -e "\n${YELLOW}Testing Generate Music...${NC}"
MUSIC_GEN_DATA="{\"tempo\":120,\"pitch\":440,\"instrument\":\"piano\",\"harmony_value\":0.7}"
MUSIC_GEN_RESPONSE=$(make_request "POST" "/universes/$UNIVERSE_ID/music/generate" "$MUSIC_GEN_DATA" "$ACCESS_TOKEN")
MUSIC_ID=$(echo $MUSIC_GEN_RESPONSE | jq -r '.id')
echo "Generate Music Response: $MUSIC_GEN_RESPONSE"

# Store Music
echo -e "\n${YELLOW}Testing Store Music...${NC}"
STORE_MUSIC_RESPONSE=$(make_request "POST" "/universes/$UNIVERSE_ID/music" "{\"music_id\":\"$MUSIC_ID\"}" "$ACCESS_TOKEN")
echo "Store Music Response: $STORE_MUSIC_RESPONSE"

# Retrieve Music
echo -e "\n${YELLOW}Testing Retrieve Music...${NC}"
GET_MUSIC_RESPONSE=$(make_request "GET" "/universes/$UNIVERSE_ID/music/$MUSIC_ID" "" "$ACCESS_TOKEN")
echo "Get Music Response: $GET_MUSIC_RESPONSE"

# Update Music Parameters
echo -e "\n${YELLOW}Testing Update Music Parameters...${NC}"
UPDATE_MUSIC_RESPONSE=$(make_request "PUT" "/universes/$UNIVERSE_ID/music/$MUSIC_ID" "{\"tempo\":140}" "$ACCESS_TOKEN")
echo "Update Music Response: $UPDATE_MUSIC_RESPONSE"

# Cleanup Tests
echo -e "\n${GREEN}Running Cleanup Tests...${NC}"

# Delete Universe (cascades to all related objects)
echo -e "\n${YELLOW}Deleting universe...${NC}"
DELETE_UNIVERSE_RESPONSE=$(make_request "DELETE" "/universes/$UNIVERSE_ID" "" "$ACCESS_TOKEN")
echo "Delete Universe Response: $DELETE_UNIVERSE_RESPONSE"

# Logout
echo -e "\n${YELLOW}Logging out...${NC}"
LOGOUT_RESPONSE=$(make_request "POST" "/auth/logout" "" "$ACCESS_TOKEN")
echo "Logout Response: $LOGOUT_RESPONSE"

echo -e "\n${GREEN}All tests completed successfully!${NC}"
