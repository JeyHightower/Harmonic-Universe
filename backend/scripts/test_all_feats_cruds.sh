#!/bin/bash

# test_all_feats_cruds.sh
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

# 1. Authentication Tests
echo -e "\n${GREEN}Testing Authentication System...${NC}"

# Register
REGISTER_RESPONSE=$(make_request "POST" "/auth/register" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"username\":\"$TEST_USERNAME\"}")
echo "Register Response: $REGISTER_RESPONSE"

# Login
LOGIN_RESPONSE=$(make_request "POST" "/auth/login" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
echo "Login Response: $LOGIN_RESPONSE"

# Get Profile
PROFILE_RESPONSE=$(make_request "GET" "/auth/me" "" "$ACCESS_TOKEN")
echo "Profile Response: $PROFILE_RESPONSE"

# Update Profile
UPDATE_PROFILE_RESPONSE=$(make_request "PUT" "/auth/me" "{\"username\":\"updated_testuser\"}" "$ACCESS_TOKEN")
echo "Update Profile Response: $UPDATE_PROFILE_RESPONSE"

# 2. Universe Tests
echo -e "\n${GREEN}Testing Universe Management...${NC}"

# Create Universe
UNIVERSE_DATA="{\"name\":\"Test Universe\",\"description\":\"Test Description\",\"is_public\":true}"
UNIVERSE_RESPONSE=$(make_request "POST" "/universes" "$UNIVERSE_DATA" "$ACCESS_TOKEN")
UNIVERSE_ID=$(echo $UNIVERSE_RESPONSE | jq -r '.id')
echo "Create Universe Response: $UNIVERSE_RESPONSE"

# Get Universe
GET_UNIVERSE_RESPONSE=$(make_request "GET" "/universes/$UNIVERSE_ID" "" "$ACCESS_TOKEN")
echo "Get Universe Response: $GET_UNIVERSE_RESPONSE"

# Update Universe
UPDATE_UNIVERSE_RESPONSE=$(make_request "PUT" "/universes/$UNIVERSE_ID" "{\"name\":\"Updated Universe\"}" "$ACCESS_TOKEN")
echo "Update Universe Response: $UPDATE_UNIVERSE_RESPONSE"

# 3. Scene Tests
echo -e "\n${GREEN}Testing Scene Management...${NC}"

# Create Scene
SCENE_DATA="{\"name\":\"Test Scene\",\"universe_id\":\"$UNIVERSE_ID\"}"
SCENE_RESPONSE=$(make_request "POST" "/scenes" "$SCENE_DATA" "$ACCESS_TOKEN")
SCENE_ID=$(echo $SCENE_RESPONSE | jq -r '.id')
echo "Create Scene Response: $SCENE_RESPONSE"

# Get Scene
GET_SCENE_RESPONSE=$(make_request "GET" "/scenes/$SCENE_ID" "" "$ACCESS_TOKEN")
echo "Get Scene Response: $GET_SCENE_RESPONSE"

# Update Scene
UPDATE_SCENE_RESPONSE=$(make_request "PUT" "/scenes/$SCENE_ID" "{\"name\":\"Updated Scene\"}" "$ACCESS_TOKEN")
echo "Update Scene Response: $UPDATE_SCENE_RESPONSE"

# 4. Physics Objects Tests
echo -e "\n${GREEN}Testing Physics Objects...${NC}"

# Create Physics Object
PHYSICS_OBJECT_DATA="{\"name\":\"Test Object\",\"scene_id\":\"$SCENE_ID\",\"type\":\"sphere\",\"position\":{\"x\":0,\"y\":0,\"z\":0}}"
PHYSICS_OBJECT_RESPONSE=$(make_request "POST" "/physics-objects" "$PHYSICS_OBJECT_DATA" "$ACCESS_TOKEN")
PHYSICS_OBJECT_ID=$(echo $PHYSICS_OBJECT_RESPONSE | jq -r '.id')
echo "Create Physics Object Response: $PHYSICS_OBJECT_RESPONSE"

# Get Physics Object
GET_PHYSICS_OBJECT_RESPONSE=$(make_request "GET" "/physics-objects/$PHYSICS_OBJECT_ID" "" "$ACCESS_TOKEN")
echo "Get Physics Object Response: $GET_PHYSICS_OBJECT_RESPONSE"

# Update Physics Object
UPDATE_PHYSICS_OBJECT_RESPONSE=$(make_request "PUT" "/physics-objects/$PHYSICS_OBJECT_ID" "{\"name\":\"Updated Object\"}" "$ACCESS_TOKEN")
echo "Update Physics Object Response: $UPDATE_PHYSICS_OBJECT_RESPONSE"

# 5. Physics Parameters Tests
echo -e "\n${GREEN}Testing Physics Parameters...${NC}"

# Create Physics Parameters
PHYSICS_PARAMS_DATA="{\"scene_id\":\"$SCENE_ID\",\"gravity\":{\"x\":0,\"y\":-9.81,\"z\":0},\"air_resistance\":0.1}"
PHYSICS_PARAMS_RESPONSE=$(make_request "POST" "/physics/parameters" "$PHYSICS_PARAMS_DATA" "$ACCESS_TOKEN")
PHYSICS_PARAMS_ID=$(echo $PHYSICS_PARAMS_RESPONSE | jq -r '.id')
echo "Create Physics Parameters Response: $PHYSICS_PARAMS_RESPONSE"

# Get Physics Parameters
GET_PHYSICS_PARAMS_RESPONSE=$(make_request "GET" "/physics/parameters/$PHYSICS_PARAMS_ID" "" "$ACCESS_TOKEN")
echo "Get Physics Parameters Response: $GET_PHYSICS_PARAMS_RESPONSE"

# Update Physics Parameters
UPDATE_PHYSICS_PARAMS_RESPONSE=$(make_request "PUT" "/physics/parameters/$PHYSICS_PARAMS_ID" "{\"gravity\":{\"x\":0,\"y\":-10,\"z\":0}}" "$ACCESS_TOKEN")
echo "Update Physics Parameters Response: $UPDATE_PHYSICS_PARAMS_RESPONSE"

# 6. Audio System Tests
echo -e "\n${GREEN}Testing Audio System...${NC}"

# Create Audio Track
AUDIO_TRACK_DATA="{\"scene_id\":\"$SCENE_ID\",\"name\":\"Test Track\",\"file_type\":\"wav\"}"
AUDIO_TRACK_RESPONSE=$(make_request "POST" "/audio/tracks" "$AUDIO_TRACK_DATA" "$ACCESS_TOKEN")
AUDIO_TRACK_ID=$(echo $AUDIO_TRACK_RESPONSE | jq -r '.id')
echo "Create Audio Track Response: $AUDIO_TRACK_RESPONSE"

# Get Audio Track
GET_AUDIO_TRACK_RESPONSE=$(make_request "GET" "/audio/tracks/$AUDIO_TRACK_ID" "" "$ACCESS_TOKEN")
echo "Get Audio Track Response: $GET_AUDIO_TRACK_RESPONSE"

# Update Audio Track
UPDATE_AUDIO_TRACK_RESPONSE=$(make_request "PUT" "/audio/tracks/$AUDIO_TRACK_ID" "{\"name\":\"Updated Track\"}" "$ACCESS_TOKEN")
echo "Update Audio Track Response: $UPDATE_AUDIO_TRACK_RESPONSE"

# 7. MIDI Sequence Tests
echo -e "\n${GREEN}Testing MIDI Sequences...${NC}"

# Create MIDI Sequence
MIDI_SEQUENCE_DATA="{\"scene_id\":\"$SCENE_ID\",\"name\":\"Test Sequence\",\"tempo\":120}"
MIDI_SEQUENCE_RESPONSE=$(make_request "POST" "/music/sequences" "$MIDI_SEQUENCE_DATA" "$ACCESS_TOKEN")
MIDI_SEQUENCE_ID=$(echo $MIDI_SEQUENCE_RESPONSE | jq -r '.id')
echo "Create MIDI Sequence Response: $MIDI_SEQUENCE_RESPONSE"

# Get MIDI Sequence
GET_MIDI_SEQUENCE_RESPONSE=$(make_request "GET" "/music/sequences/$MIDI_SEQUENCE_ID" "" "$ACCESS_TOKEN")
echo "Get MIDI Sequence Response: $GET_MIDI_SEQUENCE_RESPONSE"

# Update MIDI Sequence
UPDATE_MIDI_SEQUENCE_RESPONSE=$(make_request "PUT" "/music/sequences/$MIDI_SEQUENCE_ID" "{\"tempo\":140}" "$ACCESS_TOKEN")
echo "Update MIDI Sequence Response: $UPDATE_MIDI_SEQUENCE_RESPONSE"

# Cleanup Tests
echo -e "\n${GREEN}Running Cleanup Tests...${NC}"

# Delete MIDI Sequence
DELETE_MIDI_SEQUENCE_RESPONSE=$(make_request "DELETE" "/music/sequences/$MIDI_SEQUENCE_ID" "" "$ACCESS_TOKEN")
echo "Delete MIDI Sequence Response: $DELETE_MIDI_SEQUENCE_RESPONSE"

# Delete Audio Track
DELETE_AUDIO_TRACK_RESPONSE=$(make_request "DELETE" "/audio/tracks/$AUDIO_TRACK_ID" "" "$ACCESS_TOKEN")
echo "Delete Audio Track Response: $DELETE_AUDIO_TRACK_RESPONSE"

# Delete Physics Parameters
DELETE_PHYSICS_PARAMS_RESPONSE=$(make_request "DELETE" "/physics/parameters/$PHYSICS_PARAMS_ID" "" "$ACCESS_TOKEN")
echo "Delete Physics Parameters Response: $DELETE_PHYSICS_PARAMS_RESPONSE"

# Delete Physics Object
DELETE_PHYSICS_OBJECT_RESPONSE=$(make_request "DELETE" "/physics-objects/$PHYSICS_OBJECT_ID" "" "$ACCESS_TOKEN")
echo "Delete Physics Object Response: $DELETE_PHYSICS_OBJECT_RESPONSE"

# Delete Scene
DELETE_SCENE_RESPONSE=$(make_request "DELETE" "/scenes/$SCENE_ID" "" "$ACCESS_TOKEN")
echo "Delete Scene Response: $DELETE_SCENE_RESPONSE"

# Delete Universe
DELETE_UNIVERSE_RESPONSE=$(make_request "DELETE" "/universes/$UNIVERSE_ID" "" "$ACCESS_TOKEN")
echo "Delete Universe Response: $DELETE_UNIVERSE_RESPONSE"

# Logout
LOGOUT_RESPONSE=$(make_request "POST" "/auth/logout" "" "$ACCESS_TOKEN")
echo "Logout Response: $LOGOUT_RESPONSE"

echo -e "\n${GREEN}All tests completed!${NC}"
