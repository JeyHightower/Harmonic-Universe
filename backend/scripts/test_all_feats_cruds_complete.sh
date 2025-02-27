#!/bin/bash

# test_all_feats_cruds_complete.sh
# Comprehensive test script for all features and CRUD operations

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
DEMO_EMAIL="demo@example.com"
DEMO_PASSWORD="demo123"

echo "Starting comprehensive feature and CRUD tests..."

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

# 1. Authentication System Tests
echo -e "\n${GREEN}Testing Authentication System...${NC}"

# Register User
REGISTER_RESPONSE=$(make_request "POST" "/auth/signup" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"username\":\"$TEST_USERNAME\"}")
echo "Register Response: $REGISTER_RESPONSE"

# Login User
LOGIN_RESPONSE=$(make_request "POST" "/auth/login" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
echo "Login Response: $LOGIN_RESPONSE"

# Demo User Login
DEMO_LOGIN_RESPONSE=$(make_request "POST" "/auth/login" "{\"email\":\"$DEMO_EMAIL\",\"password\":\"$DEMO_PASSWORD\"}")
echo "Demo Login Response: $DEMO_LOGIN_RESPONSE"

# Token Refresh
REFRESH_TOKEN_RESPONSE=$(make_request "POST" "/auth/refresh" "" "$ACCESS_TOKEN")
echo "Token Refresh Response: $REFRESH_TOKEN_RESPONSE"

# 2. User Management Tests
echo -e "\n${GREEN}Testing User Management...${NC}"

# Get User Profile
PROFILE_RESPONSE=$(make_request "GET" "/users/me" "" "$ACCESS_TOKEN")
echo "Get Profile Response: $PROFILE_RESPONSE"

# Update User Profile
UPDATE_PROFILE_RESPONSE=$(make_request "PUT" "/users/me" "{\"username\":\"updated_testuser\"}" "$ACCESS_TOKEN")
echo "Update Profile Response: $UPDATE_PROFILE_RESPONSE"

# Update User Settings
UPDATE_SETTINGS_RESPONSE=$(make_request "PUT" "/users/me/settings" "{\"theme\":\"dark\",\"notifications\":true}" "$ACCESS_TOKEN")
echo "Update Settings Response: $UPDATE_SETTINGS_RESPONSE"

# 3. Universe Management Tests
echo -e "\n${GREEN}Testing Universe Management...${NC}"

# Create Universe
UNIVERSE_DATA="{\"name\":\"Test Universe\",\"description\":\"Test Description\",\"is_public\":true}"
UNIVERSE_RESPONSE=$(make_request "POST" "/universes" "$UNIVERSE_DATA" "$ACCESS_TOKEN")
UNIVERSE_ID=$(echo $UNIVERSE_RESPONSE | jq -r '.id')
echo "Create Universe Response: $UNIVERSE_RESPONSE"

# Get Universe Details
GET_UNIVERSE_RESPONSE=$(make_request "GET" "/universes/$UNIVERSE_ID" "" "$ACCESS_TOKEN")
echo "Get Universe Response: $GET_UNIVERSE_RESPONSE"

# Update Universe
UPDATE_UNIVERSE_RESPONSE=$(make_request "PUT" "/universes/$UNIVERSE_ID" "{\"name\":\"Updated Universe\"}" "$ACCESS_TOKEN")
echo "Update Universe Response: $UPDATE_UNIVERSE_RESPONSE"

# List All Universes
LIST_UNIVERSES_RESPONSE=$(make_request "GET" "/universes" "" "$ACCESS_TOKEN")
echo "List Universes Response: $LIST_UNIVERSES_RESPONSE"

# Filter Universes
FILTER_UNIVERSES_RESPONSE=$(make_request "GET" "/universes?sort=created_at&order=desc&public=true" "" "$ACCESS_TOKEN")
echo "Filter Universes Response: $FILTER_UNIVERSES_RESPONSE"

# 4. Physics Objects Tests
echo -e "\n${GREEN}Testing Physics Objects...${NC}"

# Create Physics Object
PHYSICS_OBJECT_DATA="{\"name\":\"Test Object\",\"type\":\"sphere\",\"position\":{\"x\":0,\"y\":0,\"z\":0}}"
PHYSICS_OBJECT_RESPONSE=$(make_request "POST" "/universes/$UNIVERSE_ID/physics" "$PHYSICS_OBJECT_DATA" "$ACCESS_TOKEN")
PHYSICS_OBJECT_ID=$(echo $PHYSICS_OBJECT_RESPONSE | jq -r '.id')
echo "Create Physics Object Response: $PHYSICS_OBJECT_RESPONSE"

# Get Physics Object
GET_PHYSICS_OBJECT_RESPONSE=$(make_request "GET" "/universes/$UNIVERSE_ID/physics/$PHYSICS_OBJECT_ID" "" "$ACCESS_TOKEN")
echo "Get Physics Object Response: $GET_PHYSICS_OBJECT_RESPONSE"

# Update Physics Object
UPDATE_PHYSICS_OBJECT_RESPONSE=$(make_request "PUT" "/universes/$UNIVERSE_ID/physics/$PHYSICS_OBJECT_ID" "{\"position\":{\"x\":1,\"y\":1,\"z\":1}}" "$ACCESS_TOKEN")
echo "Update Physics Object Response: $UPDATE_PHYSICS_OBJECT_RESPONSE"

# Delete Physics Object
DELETE_PHYSICS_OBJECT_RESPONSE=$(make_request "DELETE" "/universes/$UNIVERSE_ID/physics/$PHYSICS_OBJECT_ID" "" "$ACCESS_TOKEN")
echo "Delete Physics Object Response: $DELETE_PHYSICS_OBJECT_RESPONSE"

# 5. Scene Management Tests
echo -e "\n${GREEN}Testing Scene Management...${NC}"

# Create Scene
SCENE_DATA="{\"name\":\"Test Scene\",\"plot_point\":\"Initial setup\",\"harmony_tie\":0.5}"
SCENE_RESPONSE=$(make_request "POST" "/universes/$UNIVERSE_ID/storyboards" "$SCENE_DATA" "$ACCESS_TOKEN")
SCENE_ID=$(echo $SCENE_RESPONSE | jq -r '.id')
echo "Create Scene Response: $SCENE_RESPONSE"

# Get Scene Details
GET_SCENE_RESPONSE=$(make_request "GET" "/universes/$UNIVERSE_ID/storyboards/$SCENE_ID" "" "$ACCESS_TOKEN")
echo "Get Scene Response: $GET_SCENE_RESPONSE"

# Update Scene
UPDATE_SCENE_RESPONSE=$(make_request "PUT" "/universes/$UNIVERSE_ID/storyboards/$SCENE_ID" "{\"plot_point\":\"Updated setup\"}" "$ACCESS_TOKEN")
echo "Update Scene Response: $UPDATE_SCENE_RESPONSE"

# Delete Scene
DELETE_SCENE_RESPONSE=$(make_request "DELETE" "/universes/$UNIVERSE_ID/storyboards/$SCENE_ID" "" "$ACCESS_TOKEN")
echo "Delete Scene Response: $DELETE_SCENE_RESPONSE"

# 6. Music Generation Tests
echo -e "\n${GREEN}Testing Music Generation...${NC}"

# Generate Music
MUSIC_GEN_DATA="{\"tempo\":120,\"pitch\":440,\"instrument\":\"piano\",\"harmony_value\":0.7}"
MUSIC_GEN_RESPONSE=$(make_request "POST" "/universes/$UNIVERSE_ID/music/generate" "$MUSIC_GEN_DATA" "$ACCESS_TOKEN")
MUSIC_ID=$(echo $MUSIC_GEN_RESPONSE | jq -r '.id')
echo "Generate Music Response: $MUSIC_GEN_RESPONSE"

# Store Music
STORE_MUSIC_RESPONSE=$(make_request "POST" "/universes/$UNIVERSE_ID/music" "{\"music_id\":\"$MUSIC_ID\"}" "$ACCESS_TOKEN")
echo "Store Music Response: $STORE_MUSIC_RESPONSE"

# Retrieve Music
GET_MUSIC_RESPONSE=$(make_request "GET" "/universes/$UNIVERSE_ID/music/$MUSIC_ID" "" "$ACCESS_TOKEN")
echo "Get Music Response: $GET_MUSIC_RESPONSE"

# Update Music Parameters
UPDATE_MUSIC_RESPONSE=$(make_request "PUT" "/universes/$UNIVERSE_ID/music/$MUSIC_ID" "{\"tempo\":140}" "$ACCESS_TOKEN")
echo "Update Music Response: $UPDATE_MUSIC_RESPONSE"

# Cleanup Tests
echo -e "\n${GREEN}Running Cleanup Tests...${NC}"

# Delete Universe (cascades to all related objects)
DELETE_UNIVERSE_RESPONSE=$(make_request "DELETE" "/universes/$UNIVERSE_ID" "" "$ACCESS_TOKEN")
echo "Delete Universe Response: $DELETE_UNIVERSE_RESPONSE"

# Logout
LOGOUT_RESPONSE=$(make_request "POST" "/auth/logout" "" "$ACCESS_TOKEN")
echo "Logout Response: $LOGOUT_RESPONSE"

echo -e "\n${GREEN}All tests completed!${NC}"
