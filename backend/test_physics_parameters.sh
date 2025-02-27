#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Base URL for the API
BASE_URL="http://localhost:8000/api"

# Function to print section header
print_section() {
    echo -e "\n${YELLOW}=== $1 ===${NC}\n"
}

# Function to check response
check_response() {
    if [ $1 -eq 0 ] && [ $2 -eq $3 ]; then
        echo -e "${GREEN}✓ Test passed${NC}"
        return 0
    else
        echo -e "${RED}✗ Test failed${NC}"
        echo "Expected status code $3, got $2"
        echo "Response: $4"
        return 1
    fi
}

# Login as demo user to get token
print_section "Logging in as demo user"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"demo@example.com","password":"demo123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo -e "${RED}Failed to get access token${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Successfully logged in${NC}"

# Create a universe for testing
print_section "Creating test universe"
UNIVERSE_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/universes" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "name": "Test Universe",
        "description": "Universe for testing physics parameters",
        "is_public": true,
        "physics_params": {
            "gravity": 9.81,
            "air_resistance": 0.1,
            "elasticity": 0.8,
            "friction": 0.3
        },
        "harmony_params": {
            "resonance": 0.7,
            "dissonance": 0.3,
            "harmony_scale": 1.0,
            "balance": 0.5
        }
    }')
HTTP_CODE=${UNIVERSE_RESPONSE: -3}
BODY=${UNIVERSE_RESPONSE:0:${#UNIVERSE_RESPONSE}-3}
check_response $? $HTTP_CODE 200 "$BODY"
UNIVERSE_ID=$(echo $BODY | jq -r '.id')

# Create a scene for testing
print_section "Creating test scene"
SCENE_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/scenes" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "name": "Test Scene",
        "description": "Scene for testing physics parameters",
        "universe_id": "'$UNIVERSE_ID'",
        "order": 1
    }')
HTTP_CODE=${SCENE_RESPONSE: -3}
BODY=${SCENE_RESPONSE:0:${#SCENE_RESPONSE}-3}
check_response $? $HTTP_CODE 200 "$BODY"
SCENE_ID=$(echo $BODY | jq -r '.id')

# Test 1: Get physics parameters (empty list initially)
print_section "Test 1: Get physics parameters"
RESPONSE=$(curl -s -w "%{http_code}" "$BASE_URL/scenes/$SCENE_ID/physics_parameters" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE=${RESPONSE: -3}
BODY=${RESPONSE:0:${#RESPONSE}-3}
check_response $? $HTTP_CODE 200 "$BODY"

# Test 2: Create physics parameters
print_section "Test 2: Create physics parameters"
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/scenes/$SCENE_ID/physics_parameters" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "scene_id": "'$SCENE_ID'",
        "version": 1,
        "is_active": true,
        "gravity": {
            "value": 9.81,
            "unit": "m/s²",
            "min": 0,
            "max": 20,
            "enabled": true
        },
        "air_resistance": {
            "value": 0.1,
            "unit": "kg/m³",
            "min": 0,
            "max": 1,
            "enabled": true
        },
        "collision_elasticity": {
            "value": 0.7,
            "unit": "coefficient",
            "min": 0,
            "max": 1,
            "enabled": true
        },
        "friction": {
            "value": 0.3,
            "unit": "coefficient",
            "min": 0,
            "max": 1,
            "enabled": true
        }
    }')
HTTP_CODE=${RESPONSE: -3}
BODY=${RESPONSE:0:${#RESPONSE}-3}
PARAMS_ID=$(echo $BODY | jq -r '.id')
check_response $? $HTTP_CODE 200 "$BODY"

# Test 3: Get specific physics parameters
print_section "Test 3: Get specific physics parameters"
RESPONSE=$(curl -s -w "%{http_code}" "$BASE_URL/scenes/$SCENE_ID/physics_parameters/$PARAMS_ID" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE=${RESPONSE: -3}
BODY=${RESPONSE:0:${#RESPONSE}-3}
check_response $? $HTTP_CODE 200 "$BODY"

# Test 4: Update physics parameters
print_section "Test 4: Update physics parameters"
RESPONSE=$(curl -s -w "%{http_code}" -X PUT "$BASE_URL/scenes/$SCENE_ID/physics_parameters/$PARAMS_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "gravity": {
            "value": 5.0,
            "unit": "m/s²",
            "min": 0,
            "max": 20,
            "enabled": true
        }
    }')
HTTP_CODE=${RESPONSE: -3}
BODY=${RESPONSE:0:${#RESPONSE}-3}
check_response $? $HTTP_CODE 200 "$BODY"

# Test 5: Delete physics parameters
print_section "Test 5: Delete physics parameters"
RESPONSE=$(curl -s -w "%{http_code}" -X DELETE "$BASE_URL/scenes/$SCENE_ID/physics_parameters/$PARAMS_ID" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE=${RESPONSE: -3}
BODY=${RESPONSE:0:${#RESPONSE}-3}
check_response $? $HTTP_CODE 200 "$BODY"

# Test 6: Verify deletion
print_section "Test 6: Verify deletion"
RESPONSE=$(curl -s -w "%{http_code}" "$BASE_URL/scenes/$SCENE_ID/physics_parameters/$PARAMS_ID" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE=${RESPONSE: -3}
BODY=${RESPONSE:0:${#RESPONSE}-3}
check_response $? $HTTP_CODE 404 "$BODY"

# Cleanup: Delete the scene and universe
print_section "Cleanup"
echo "Deleting scene..."
curl -s -X DELETE "$BASE_URL/scenes/$SCENE_ID" \
    -H "Authorization: Bearer $TOKEN"

echo "Deleting universe..."
curl -s -X DELETE "$BASE_URL/universes/$UNIVERSE_ID" \
    -H "Authorization: Bearer $TOKEN"

echo -e "\n${GREEN}All tests completed${NC}"
