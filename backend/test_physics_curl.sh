#!/bin/bash

# Set the base URL for the API
BASE_URL="http://localhost:8000/api"

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Function to print result
print_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1${NC}"
        if [ ! -z "$2" ]; then
            echo -e "${YELLOW}Response: $2${NC}"
        fi
        exit 1
    fi
}

# Function to print section header
print_section() {
    echo -e "\n${BOLD}${CYAN}=== $1 ===${NC}"
}

# Function to validate universe object structure
validate_universe_structure() {
    local universe_json="$1"
    local check_name="$2"

    # Check required fields exist and have correct types
    echo "$universe_json" | jq -e '
        has("id") and
        ((.id | type) == "string") and
        has("name") and
        ((.name | type) == "string") and
        has("description") and
        ((.description | type) == "string") and
        has("is_public") and
        ((.is_public | type) == "boolean") and
        has("user_id") and
        ((.user_id | type) == "string") and
        has("version") and
        ((.version | type) == "number") and
        has("physics_params") and
        has("harmony_params") and
        has("story_points") and
        has("visualization_params") and
        has("ai_params") and
        has("created_at") and
        has("updated_at") and
        ((.created_at | type) == "string") and
        ((.updated_at | type) == "string")
    ' > /dev/null

    print_result "Universe structure validation for $check_name"
}

# Function to validate physics object structure
validate_physics_object_structure() {
    local object_json="$1"
    local check_name="$2"

    # Check required fields exist and have correct types
    echo "$object_json" | jq -e '
        has("id") and
        ((.id | type) == "string") and
        has("name") and
        ((.name | type) == "string") and
        has("scene_id") and
        ((.scene_id | type) == "string") and
        has("object_type") and
        ((.object_type | type) == "string") and
        has("position") and
        ((.position | type) == "object") and
        has("velocity") and
        ((.velocity | type) == "object") and
        has("mass") and
        ((.mass | type) == "number") and
        has("radius") and
        ((.radius | type) == "number") and
        has("created_at") and
        has("updated_at") and
        ((.created_at | type) == "string") and
        ((.updated_at | type) == "string")
    ' > /dev/null

    print_result "Physics object structure validation for $check_name"
}

# Function to validate scene structure
validate_scene_structure() {
    local scene_json="$1"
    local check_name="$2"

    # Check required fields exist and have correct types
    echo "$scene_json" | jq -e '
        has("id") and
        ((.id | type) == "string") and
        has("name") and
        ((.name | type) == "string") and
        has("universe_id") and
        ((.universe_id | type) == "string") and
        has("description") and
        ((.description | type) == "string") and
        has("order") and
        ((.order | type) == "number") and
        has("created_at") and
        has("updated_at") and
        ((.created_at | type) == "string") and
        ((.updated_at | type) == "string")
    ' > /dev/null

    print_result "Scene structure validation for $check_name"
}

# Function to validate music generation structure
validate_music_structure() {
    local music_json="$1"
    local check_name="$2"

    # Check required fields exist and have correct types
    echo "$music_json" | jq -e '
        has("status") and
        ((.status | type) == "string") and
        has("message") and
        ((.message | type) == "string") and
        has("universe_id") and
        ((.universe_id | type) == "string")
    ' > /dev/null

    print_result "Music generation structure validation for $check_name"
}

# Login to get JWT token
print_section "Authentication"
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "demo@example.com", "password": "demo123"}')

# Check login success
echo $LOGIN_RESPONSE | grep -q "access_token"
print_result "Login" "$LOGIN_RESPONSE"

# Extract the token
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

# Check the token is not empty
[ -n "$TOKEN" ]
print_result "Token extraction"

# Check user profile
USER_RESPONSE=$(curl -s -X GET $BASE_URL/auth/profile \
    -H "Authorization: Bearer $TOKEN")

# Check profile success
echo $USER_RESPONSE | grep -q "email"
print_result "Get user profile" "$USER_RESPONSE"

# UNIVERSE TESTS
print_section "Universe CRUD Operations"

# Get all universes
echo "Getting all universes..."
UNIVERSES_RESPONSE=$(curl -s -X GET $BASE_URL/universes/ \
    -H "Authorization: Bearer $TOKEN")

# Check universes response
echo $UNIVERSES_RESPONSE | jq -e 'length >= 0' > /dev/null
print_result "Get all universes"

# Create a new universe
echo "Creating a new universe..."
CREATE_UNIVERSE_RESPONSE=$(curl -s -X POST $BASE_URL/universes/ \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
    "name": "Test Universe",
    "description": "A universe created for testing",
    "is_public": true,
    "physics_params": {
        "gravity": {"value": 9.8, "min": 0, "max": 20, "warning_threshold": 1, "unit": "m/s²"},
        "friction": {"value": 0.5, "min": 0, "max": 1, "warning_threshold": 0.1, "unit": "coef"}
    },
    "harmony_params": {
        "tempo": {"value": 120, "min": 60, "max": 180, "warning_threshold": 10, "unit": "bpm"},
        "key": {"value": "C", "options": ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"]}
    },
    "visualization_params": {
        "color_scheme": {"value": "blue", "options": ["blue", "red", "green", "purple"]}
    },
    "story_points": [],
    "ai_params": {
        "creativity": {"value": 0.7, "min": 0, "max": 1, "warning_threshold": 0.1, "unit": "factor"}
    }
}')

# Check universe creation response
echo $CREATE_UNIVERSE_RESPONSE | grep -q "id"
print_result "Create universe" "$CREATE_UNIVERSE_RESPONSE"

# Validate universe structure
validate_universe_structure "$CREATE_UNIVERSE_RESPONSE" "created universe"

# Extract the universe ID
UNIVERSE_ID=$(echo $CREATE_UNIVERSE_RESPONSE | jq -r '.id')

# Check universe ID is not empty
[ -n "$UNIVERSE_ID" ]
print_result "Universe ID extraction"

# Get the created universe by ID
echo "Getting the created universe..."
GET_UNIVERSE_RESPONSE=$(curl -s -X GET $BASE_URL/universes/$UNIVERSE_ID \
    -H "Authorization: Bearer $TOKEN")

# Check get universe response
echo $GET_UNIVERSE_RESPONSE | grep -q "id"
print_result "Get universe by ID" "$GET_UNIVERSE_RESPONSE"

# Validate universe structure
validate_universe_structure "$GET_UNIVERSE_RESPONSE" "retrieved universe"

# Update the universe
echo "Updating the universe..."
UPDATE_UNIVERSE_RESPONSE=$(curl -s -X PUT $BASE_URL/universes/$UNIVERSE_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
    "name": "Updated Test Universe",
    "description": "An updated universe for testing",
    "is_public": false,
    "physics_params": {
        "gravity": {"value": 8.0, "min": 0, "max": 20, "warning_threshold": 1, "unit": "m/s²"},
        "friction": {"value": 0.7, "min": 0, "max": 1, "warning_threshold": 0.1, "unit": "coef"}
    },
    "harmony_params": {
        "tempo": {"value": 100, "min": 60, "max": 180, "warning_threshold": 10, "unit": "bpm"},
        "key": {"value": "G", "options": ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"]}
    },
    "visualization_params": {
        "color_scheme": {"value": "purple", "options": ["blue", "red", "green", "purple"]}
    },
    "story_points": [],
    "ai_params": {
        "creativity": {"value": 0.5, "min": 0, "max": 1, "warning_threshold": 0.1, "unit": "factor"}
    }
}')

# Check update universe response
echo $UPDATE_UNIVERSE_RESPONSE | grep -q "id"
print_result "Update universe" "$UPDATE_UNIVERSE_RESPONSE"

# Validate universe structure
validate_universe_structure "$UPDATE_UNIVERSE_RESPONSE" "updated universe"

# Check updated values
echo $UPDATE_UNIVERSE_RESPONSE | jq -e '.name == "Updated Test Universe"' > /dev/null
print_result "Updated name verification"

echo $UPDATE_UNIVERSE_RESPONSE | jq -e '.physics_params.gravity.value == 8.0' > /dev/null
print_result "Updated physics_params verification"

# SCENE TESTS
print_section "Scene CRUD Operations"

# Create a scene
echo "Creating a scene..."
CREATE_SCENE_RESPONSE=$(curl -s -X POST $BASE_URL/scenes/ \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
    "name": "Test Scene",
    "description": "A scene created for testing",
    "universe_id": "'$UNIVERSE_ID'",
    "order": 1
}')

# Check scene creation response
echo $CREATE_SCENE_RESPONSE | grep -q "id"
print_result "Create scene" "$CREATE_SCENE_RESPONSE"

# Validate scene structure
validate_scene_structure "$CREATE_SCENE_RESPONSE" "created scene"

# Extract the scene ID
SCENE_ID=$(echo $CREATE_SCENE_RESPONSE | jq -r '.id')

# Check scene ID is not empty
[ -n "$SCENE_ID" ]
print_result "Scene ID extraction"

# Get the scene
echo "Getting the scene..."
GET_SCENE_RESPONSE=$(curl -s -X GET $BASE_URL/scenes/$SCENE_ID \
    -H "Authorization: Bearer $TOKEN")

# Check get scene response
echo $GET_SCENE_RESPONSE | grep -q "id"
print_result "Get scene" "$GET_SCENE_RESPONSE"

# Validate scene structure
validate_scene_structure "$GET_SCENE_RESPONSE" "retrieved scene"

# Update the scene
echo "Updating the scene..."
UPDATE_SCENE_RESPONSE=$(curl -s -X PUT $BASE_URL/scenes/$SCENE_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
    "name": "Updated Test Scene",
    "description": "An updated scene for testing",
    "universe_id": "'$UNIVERSE_ID'",
    "order": 2
}')

# Check update scene response
echo $UPDATE_SCENE_RESPONSE | grep -q "id"
print_result "Update scene" "$UPDATE_SCENE_RESPONSE"

# Validate scene structure
validate_scene_structure "$UPDATE_SCENE_RESPONSE" "updated scene"

# PHYSICS OBJECT TESTS
print_section "Physics Object CRUD Operations"

# Create a physics object
echo "Creating a physics object..."
CREATE_OBJECT_RESPONSE=$(curl -s -X POST $BASE_URL/physics-objects/ \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
    "name": "Test Object",
    "scene_id": "'$SCENE_ID'",
    "object_type": "particle",
    "position": {"x": 0, "y": 0, "z": 0},
    "velocity": {"x": 0, "y": 0, "z": 0},
    "mass": 10,
    "radius": 5,
    "color": "#FF0000",
    "is_fixed": false,
    "properties": {"charge": 1.0}
}')

# Check object creation response
echo $CREATE_OBJECT_RESPONSE | grep -q "id"
print_result "Create physics object" "$CREATE_OBJECT_RESPONSE"

# Validate physics object structure
validate_physics_object_structure "$CREATE_OBJECT_RESPONSE" "created object"

# Extract the object ID
OBJECT_ID=$(echo $CREATE_OBJECT_RESPONSE | jq -r '.id')

# Check object ID is not empty
[ -n "$OBJECT_ID" ]
print_result "Physics object ID extraction"

# Get the physics object
echo "Getting the physics object..."
GET_OBJECT_RESPONSE=$(curl -s -X GET $BASE_URL/physics-objects/$OBJECT_ID \
    -H "Authorization: Bearer $TOKEN")

# Check get object response
echo $GET_OBJECT_RESPONSE | grep -q "id"
print_result "Get physics object" "$GET_OBJECT_RESPONSE"

# Validate physics object structure
validate_physics_object_structure "$GET_OBJECT_RESPONSE" "retrieved object"

# Update the physics object
echo "Updating the physics object..."
UPDATE_OBJECT_RESPONSE=$(curl -s -X PUT $BASE_URL/physics-objects/$OBJECT_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
    "name": "Updated Test Object",
    "scene_id": "'$SCENE_ID'",
    "object_type": "particle",
    "position": {"x": 10, "y": 10, "z": 10},
    "velocity": {"x": 1, "y": 1, "z": 1},
    "mass": 20,
    "radius": 10,
    "color": "#00FF00",
    "is_fixed": true,
    "properties": {"charge": 2.0}
}')

# Check update object response
echo $UPDATE_OBJECT_RESPONSE | grep -q "id"
print_result "Update physics object" "$UPDATE_OBJECT_RESPONSE"

# Validate physics object structure
validate_physics_object_structure "$UPDATE_OBJECT_RESPONSE" "updated object"

# MUSIC GENERATION TESTS
print_section "Music Generation Operations"

# Request music generation
echo "Requesting music generation..."
MUSIC_REQUEST_RESPONSE=$(curl -s -X POST $BASE_URL/music/generate/$UNIVERSE_ID \
    -H "Authorization: Bearer $TOKEN")

# Check music request response
echo $MUSIC_REQUEST_RESPONSE | grep -q "status"
print_result "Request music generation" "$MUSIC_REQUEST_RESPONSE"

# Validate music structure
validate_music_structure "$MUSIC_REQUEST_RESPONSE" "music request"

# Get music generation status
echo "Checking music generation status..."
MUSIC_STATUS_RESPONSE=$(curl -s -X GET $BASE_URL/music/status/$UNIVERSE_ID \
    -H "Authorization: Bearer $TOKEN")

# Check music status response
echo $MUSIC_STATUS_RESPONSE | grep -q "status"
print_result "Get music generation status" "$MUSIC_STATUS_RESPONSE"

# Clean up - Delete the physics object
print_section "Cleanup Operations"
echo "Deleting the physics object..."
DELETE_OBJECT_RESPONSE=$(curl -s -X DELETE $BASE_URL/physics-objects/$OBJECT_ID \
    -H "Authorization: Bearer $TOKEN")

# Check delete object response
echo $DELETE_OBJECT_RESPONSE | grep -q "success"
print_result "Delete physics object" "$DELETE_OBJECT_RESPONSE"

# Delete the scene
echo "Deleting the scene..."
DELETE_SCENE_RESPONSE=$(curl -s -X DELETE $BASE_URL/scenes/$SCENE_ID \
    -H "Authorization: Bearer $TOKEN")

# Check delete scene response
echo $DELETE_SCENE_RESPONSE | grep -q "success"
print_result "Delete scene" "$DELETE_SCENE_RESPONSE"

# Delete the universe
echo "Deleting the universe..."
DELETE_UNIVERSE_RESPONSE=$(curl -s -X DELETE $BASE_URL/universes/$UNIVERSE_ID \
    -H "Authorization: Bearer $TOKEN")

# Check delete universe response
echo $DELETE_UNIVERSE_RESPONSE | grep -q "success"
print_result "Delete universe" "$DELETE_UNIVERSE_RESPONSE"

echo -e "\n${GREEN}${BOLD}All tests completed successfully!${NC}"
