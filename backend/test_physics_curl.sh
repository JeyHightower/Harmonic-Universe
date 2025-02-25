#!/bin/bash

# Set the base URL for the API
BASE_URL="http://localhost:8000/api"

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
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
        has("user_role")
    ' > /dev/null

    if [ $? -ne 0 ]; then
        echo "Invalid universe structure"
        return 1
    fi

    # If name is provided, check it matches
    if [ ! -z "$check_name" ]; then
        local actual_name=$(echo "$universe_json" | jq -r '.name')
        if [ "$actual_name" != "$check_name" ]; then
            echo "Name mismatch: expected $check_name, got $actual_name"
            return 1
        fi
    fi

    return 0
}

# Function to validate scene object structure
validate_scene_structure() {
    local scene_json="$1"
    local check_name="$2"

    # Check required fields exist and have correct types
    echo "$scene_json" | jq -e '
        has("id") and
        ((.id | type) == "string") and
        has("name") and
        ((.name | type) == "string") and
        has("description") and
        has("universe_id") and
        ((.universe_id | type) == "string") and
        has("created_at") and
        has("updated_at")
    ' > /dev/null

    if [ $? -ne 0 ]; then
        echo "Invalid scene structure"
        return 1
    fi

    # If name is provided, check it matches
    if [ ! -z "$check_name" ]; then
        local actual_name=$(echo "$scene_json" | jq -r '.name')
        if [ "$actual_name" != "$check_name" ]; then
            echo "Name mismatch: expected $check_name, got $actual_name"
            return 1
        fi
    fi

    return 0
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
        has("mass") and
        ((.mass | type) == "number") and
        has("is_static") and
        ((.is_static | type) == "boolean") and
        has("is_trigger") and
        ((.is_trigger | type) == "boolean") and
        has("collision_shape") and
        ((.collision_shape | type) == "string") and
        has("position") and
        has("velocity") and
        has("rotation") and
        has("scale") and
        has("material_properties") and
        has("created_at") and
        has("updated_at")
    ' > /dev/null

    if [ $? -ne 0 ]; then
        echo "Invalid physics object structure"
        return 1
    fi

    # If name is provided, check it matches
    if [ ! -z "$check_name" ]; then
        local actual_name=$(echo "$object_json" | jq -r '.name')
        if [ "$actual_name" != "$check_name" ]; then
            echo "Name mismatch: expected $check_name, got $actual_name"
            return 1
        fi
    fi

    return 0
}

echo "Starting universe CRUD tests..."

# Login and get token
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"demo@example.com","password":"demo123"}')
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo -e "${RED}Failed to get token${NC}"
    echo -e "${YELLOW}Login response: $LOGIN_RESPONSE${NC}"
    exit 1
fi
print_result "Login successful"

# Test CREATE
echo "Testing universe creation..."
CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/universes/" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test Universe",
        "description": "A test universe for CRUD operations",
        "is_public": true
    }')

# Validate creation response
echo "Validating creation response..."
validate_universe_structure "$CREATE_RESPONSE" "Test Universe"
print_result "Universe creation" "$CREATE_RESPONSE"

# Store universe ID for further tests
UNIVERSE_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id')

# Test READ (Get specific universe)
echo "Testing universe retrieval..."
READ_RESPONSE=$(curl -s -X GET "${BASE_URL}/universes/${UNIVERSE_ID}/" \
    -H "Authorization: Bearer ${TOKEN}")

# Validate read response
echo "Validating read response..."
validate_universe_structure "$READ_RESPONSE" "Test Universe"
print_result "Universe retrieval" "$READ_RESPONSE"

# Test READ (List all universes)
echo "Testing universe list..."
LIST_RESPONSE=$(curl -s -X GET "${BASE_URL}/universes/?sort_by=created_at&sort_order=desc" \
    -H "Authorization: Bearer ${TOKEN}")

# Validate list response
echo "Validating list response..."
echo "$LIST_RESPONSE" | jq -e 'type == "array"' > /dev/null
print_result "Universe list retrieval" "$LIST_RESPONSE"

# Test UPDATE
echo "Testing universe update..."
UPDATE_RESPONSE=$(curl -s -X PUT "${BASE_URL}/universes/${UNIVERSE_ID}/" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Updated Test Universe",
        "description": "Updated description",
        "is_public": false
    }')

# Validate update response
echo "Validating update response..."
validate_universe_structure "$UPDATE_RESPONSE" "Updated Test Universe"
print_result "Universe update" "$UPDATE_RESPONSE"

# Verify update with GET
echo "Verifying update..."
VERIFY_UPDATE_RESPONSE=$(curl -s -X GET "${BASE_URL}/universes/${UNIVERSE_ID}/" \
    -H "Authorization: Bearer ${TOKEN}")

# Check if update was successful
echo "$VERIFY_UPDATE_RESPONSE" | jq -e '.name == "Updated Test Universe" and .description == "Updated description" and .is_public == false' > /dev/null
print_result "Update verification" "$VERIFY_UPDATE_RESPONSE"

# Test invalid update (should fail)
echo "Testing invalid update..."
INVALID_UPDATE_RESPONSE=$(curl -s -w "%{http_code}" -X PUT "${BASE_URL}/universes/${UNIVERSE_ID}/" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"invalid_field": "test"}')

HTTP_CODE=${INVALID_UPDATE_RESPONSE: -3}
if [ "$HTTP_CODE" -eq 400 ]; then
    print_result "Invalid update test (expected 400 error)"
else
    echo -e "${RED}✗ Invalid update test failed - expected 400 but got ${HTTP_CODE}${NC}"
    exit 1
fi

# --------------------------------
# Scene CRUD Tests
# --------------------------------
echo "Starting Scene CRUD tests..."

# Create a scene in the universe
echo "Testing scene creation..."
CREATE_SCENE_RESPONSE=$(curl -s -X POST "${BASE_URL}/universes/${UNIVERSE_ID}/scenes" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test Scene",
        "description": "A test scene for CRUD operations",
        "universe_id": "'${UNIVERSE_ID}'"
    }')

# Validate scene creation response
echo "Validating scene creation response..."
validate_scene_structure "$CREATE_SCENE_RESPONSE" "Test Scene"
print_result "Scene creation" "$CREATE_SCENE_RESPONSE"

# Store scene ID for further tests
SCENE_ID=$(echo "$CREATE_SCENE_RESPONSE" | jq -r '.id')

# Test Scene READ (Get specific scene)
echo "Testing scene retrieval..."
READ_SCENE_RESPONSE=$(curl -s -X GET "${BASE_URL}/universes/${UNIVERSE_ID}/scenes/${SCENE_ID}" \
    -H "Authorization: Bearer ${TOKEN}")

# Validate scene read response
echo "Validating scene read response..."
validate_scene_structure "$READ_SCENE_RESPONSE" "Test Scene"
print_result "Scene retrieval" "$READ_SCENE_RESPONSE"

# Test Scene READ (List all scenes in universe)
echo "Testing scene list..."
LIST_SCENES_RESPONSE=$(curl -s -X GET "${BASE_URL}/universes/${UNIVERSE_ID}/scenes" \
    -H "Authorization: Bearer ${TOKEN}")

# Validate scenes list response
echo "Validating scenes list response..."
echo "$LIST_SCENES_RESPONSE" | jq -e 'type == "array"' > /dev/null
print_result "Scene list retrieval" "$LIST_SCENES_RESPONSE"

# Test Scene UPDATE
echo "Testing scene update..."
UPDATE_SCENE_RESPONSE=$(curl -s -X PUT "${BASE_URL}/universes/${UNIVERSE_ID}/scenes/${SCENE_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Updated Test Scene",
        "description": "Updated scene description"
    }')

# Validate scene update response
echo "Validating scene update response..."
validate_scene_structure "$UPDATE_SCENE_RESPONSE" "Updated Test Scene"
print_result "Scene update" "$UPDATE_SCENE_RESPONSE"

# Verify scene update with GET
echo "Verifying scene update..."
VERIFY_SCENE_UPDATE_RESPONSE=$(curl -s -X GET "${BASE_URL}/universes/${UNIVERSE_ID}/scenes/${SCENE_ID}" \
    -H "Authorization: Bearer ${TOKEN}")

# Check if scene update was successful
echo "$VERIFY_SCENE_UPDATE_RESPONSE" | jq -e '.name == "Updated Test Scene" and .description == "Updated scene description"' > /dev/null
print_result "Scene update verification" "$VERIFY_SCENE_UPDATE_RESPONSE"

# --------------------------------
# Physics Objects CRUD Tests
# --------------------------------
echo "Starting Physics Objects CRUD tests..."

# Create a physics object in the scene
echo "Testing physics object creation..."
CREATE_OBJECT_RESPONSE=$(curl -s -X POST "${BASE_URL}/scenes/${SCENE_ID}/physics-objects" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test Physics Object",
        "scene_id": "'${SCENE_ID}'",
        "mass": 10.5,
        "is_static": false,
        "is_trigger": false,
        "collision_shape": "box",
        "position": {
            "x": 1.0,
            "y": 2.0,
            "z": 3.0
        },
        "velocity": {
            "x": 0.0,
            "y": 0.0,
            "z": 0.0
        },
        "rotation": {
            "x": 0.0,
            "y": 0.0,
            "z": 0.0
        },
        "scale": {
            "x": 1.0,
            "y": 1.0,
            "z": 1.0
        },
        "material_properties": {
            "restitution": 0.7,
            "friction": 0.3,
            "density": 1.0
        }
    }')

# Validate physics object creation response
echo "Validating physics object creation response..."
validate_physics_object_structure "$CREATE_OBJECT_RESPONSE" "Test Physics Object"
print_result "Physics object creation" "$CREATE_OBJECT_RESPONSE"

# Store physics object ID for further tests
OBJECT_ID=$(echo "$CREATE_OBJECT_RESPONSE" | jq -r '.id')

# Test Physics Object READ (Get specific object)
echo "Testing physics object retrieval..."
READ_OBJECT_RESPONSE=$(curl -s -X GET "${BASE_URL}/physics-objects/${OBJECT_ID}" \
    -H "Authorization: Bearer ${TOKEN}")

# Validate physics object read response
echo "Validating physics object read response..."
validate_physics_object_structure "$READ_OBJECT_RESPONSE" "Test Physics Object"
print_result "Physics object retrieval" "$READ_OBJECT_RESPONSE"

# Test Physics Object READ (List all objects in scene)
echo "Testing physics objects list..."
LIST_OBJECTS_RESPONSE=$(curl -s -X GET "${BASE_URL}/scenes/${SCENE_ID}/physics-objects" \
    -H "Authorization: Bearer ${TOKEN}")

# Validate physics objects list response
echo "Validating physics objects list response..."
echo "$LIST_OBJECTS_RESPONSE" | jq -e 'type == "array"' > /dev/null
print_result "Physics objects list retrieval" "$LIST_OBJECTS_RESPONSE"

# Test Physics Object UPDATE
echo "Testing physics object update..."
UPDATE_OBJECT_RESPONSE=$(curl -s -X PUT "${BASE_URL}/physics-objects/${OBJECT_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Updated Physics Object",
        "mass": 20.0,
        "is_static": true,
        "position": {
            "x": 5.0,
            "y": 5.0,
            "z": 5.0
        }
    }')

# Validate physics object update response
echo "Validating physics object update response..."
validate_physics_object_structure "$UPDATE_OBJECT_RESPONSE" "Updated Physics Object"
print_result "Physics object update" "$UPDATE_OBJECT_RESPONSE"

# Verify physics object update with GET
echo "Verifying physics object update..."
VERIFY_OBJECT_UPDATE_RESPONSE=$(curl -s -X GET "${BASE_URL}/physics-objects/${OBJECT_ID}" \
    -H "Authorization: Bearer ${TOKEN}")

# Check if physics object update was successful
echo "$VERIFY_OBJECT_UPDATE_RESPONSE" | jq -e '.name == "Updated Physics Object" and .mass == 20.0 and .is_static == true and .position.x == 5.0' > /dev/null
print_result "Physics object update verification" "$VERIFY_OBJECT_UPDATE_RESPONSE"

# Test Physics Object DELETE
echo "Testing physics object deletion..."
DELETE_OBJECT_RESPONSE=$(curl -s -w "%{http_code}" -X DELETE "${BASE_URL}/physics-objects/${OBJECT_ID}" \
    -H "Authorization: Bearer ${TOKEN}")

HTTP_CODE=${DELETE_OBJECT_RESPONSE: -3}
if [ "$HTTP_CODE" -eq 204 ]; then
    print_result "Physics object deletion"
else
    echo -e "${RED}✗ Physics object deletion failed - expected 204 but got ${HTTP_CODE}${NC}"
    exit 1
fi

# Verify physics object deletion
echo "Verifying physics object deletion..."
VERIFY_OBJECT_DELETE_RESPONSE=$(curl -s -w "%{http_code}" -X GET "${BASE_URL}/physics-objects/${OBJECT_ID}" \
    -H "Authorization: Bearer ${TOKEN}")

HTTP_CODE=${VERIFY_OBJECT_DELETE_RESPONSE: -3}
if [ "$HTTP_CODE" -eq 404 ]; then
    print_result "Physics object deletion verification (expected 404 error)"
else
    echo -e "${RED}✗ Physics object deletion verification failed - expected 404 but got ${HTTP_CODE}${NC}"
    exit 1
fi

# Test Scene DELETE
echo "Testing scene deletion..."
DELETE_SCENE_RESPONSE=$(curl -s -w "%{http_code}" -X DELETE "${BASE_URL}/universes/${UNIVERSE_ID}/scenes/${SCENE_ID}" \
    -H "Authorization: Bearer ${TOKEN}")

HTTP_CODE=${DELETE_SCENE_RESPONSE: -3}
if [ "$HTTP_CODE" -eq 204 ]; then
    print_result "Scene deletion"
else
    echo -e "${RED}✗ Scene deletion failed - expected 204 but got ${HTTP_CODE}${NC}"
    exit 1
fi

# Verify scene deletion
echo "Verifying scene deletion..."
VERIFY_SCENE_DELETE_RESPONSE=$(curl -s -w "%{http_code}" -X GET "${BASE_URL}/universes/${UNIVERSE_ID}/scenes/${SCENE_ID}" \
    -H "Authorization: Bearer ${TOKEN}")

HTTP_CODE=${VERIFY_SCENE_DELETE_RESPONSE: -3}
if [ "$HTTP_CODE" -eq 404 ]; then
    print_result "Scene deletion verification (expected 404 error)"
else
    echo -e "${RED}✗ Scene deletion verification failed - expected 404 but got ${HTTP_CODE}${NC}"
    exit 1
fi

# Test DELETE Universe
echo "Testing universe deletion..."
DELETE_RESPONSE=$(curl -s -w "%{http_code}" -X DELETE "${BASE_URL}/universes/${UNIVERSE_ID}/" \
    -H "Authorization: Bearer ${TOKEN}")

HTTP_CODE=${DELETE_RESPONSE: -3}
if [ "$HTTP_CODE" -eq 204 ]; then
    print_result "Universe deletion"
else
    echo -e "${RED}✗ Deletion failed - expected 204 but got ${HTTP_CODE}${NC}"
    exit 1
fi

# Verify deletion
echo "Verifying deletion..."
VERIFY_DELETE_RESPONSE=$(curl -s -w "%{http_code}" -X GET "${BASE_URL}/universes/${UNIVERSE_ID}/" \
    -H "Authorization: Bearer ${TOKEN}")

HTTP_CODE=${VERIFY_DELETE_RESPONSE: -3}
if [ "$HTTP_CODE" -eq 404 ]; then
    print_result "Deletion verification (expected 404 error)"
else
    echo -e "${RED}✗ Deletion verification failed - expected 404 but got ${HTTP_CODE}${NC}"
    exit 1
fi

echo "Universe CRUD tests completed successfully!"

# Create new universe for physics tests
echo "Creating new universe for physics tests..."
CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/universes/" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Physics Test Universe",
        "description": "A universe for testing physics parameters",
        "is_public": true
    }')

# Store new universe ID for physics tests
UNIVERSE_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id')
if [ -z "$UNIVERSE_ID" ] || [ "$UNIVERSE_ID" = "null" ]; then
    echo -e "${RED}Failed to create universe for physics tests${NC}"
    echo -e "${YELLOW}Create response: $CREATE_RESPONSE${NC}"
    exit 1
fi
print_result "Created universe for physics tests"

# Read physics parameters
echo "Reading physics parameters..."
echo "Attempting to read universe with ID: $UNIVERSE_ID"
RESPONSE=$(curl -s -X GET "${BASE_URL}/universes/${UNIVERSE_ID}/" \
    -H "Authorization: Bearer ${TOKEN}")
echo "Full response:"
echo "$RESPONSE" | jq '.'

echo "Checking physics parameters..."
echo "$RESPONSE" | jq -e '.physics_params.gravity.value == 9.81'
print_result "Read physics parameters" "$RESPONSE"

# Update physics parameters
echo "Updating all physics parameters..."
UPDATE_RESPONSE=$(curl -s -X PUT "${BASE_URL}/universes/${UNIVERSE_ID}/physics/" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
        "physics_params": {
            "gravity": {
                "value": 15.0,
                "unit": "m/s²",
                "min": 0,
                "max": 20
            },
            "air_resistance": {
                "value": 0.5,
                "unit": "kg/m³",
                "min": 0,
                "max": 1
            },
            "elasticity": {
                "value": 0.8,
                "unit": "coefficient",
                "min": 0,
                "max": 1
            },
            "friction": {
                "value": 0.3,
                "unit": "coefficient",
                "min": 0,
                "max": 1
            },
            "temperature": {
                "value": 350.0,
                "unit": "K",
                "min": 0,
                "max": 1000
            },
            "pressure": {
                "value": 150.0,
                "unit": "kPa",
                "min": 0,
                "max": 200
            }
        }
    }')
echo "Update response:"
echo "$UPDATE_RESPONSE" | jq '.'

echo "Verifying all updates..."
echo "$UPDATE_RESPONSE" | jq -e '
    .physics_params.gravity.value == 15.0 and
    .physics_params.air_resistance.value == 0.5 and
    .physics_params.elasticity.value == 0.8 and
    .physics_params.friction.value == 0.3 and
    .physics_params.temperature.value == 350.0 and
    .physics_params.pressure.value == 150.0
'
print_result "Update all physics parameters" "$UPDATE_RESPONSE"

# Test validation (should fail with 400)
echo "Testing validation..."
RESPONSE=$(curl -s -w "%{http_code}" -X PUT "${BASE_URL}/universes/${UNIVERSE_ID}/physics/" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
        "physics_params": {
            "gravity": {
                "value": 25.0,
                "unit": "m/s²",
                "min": 0,
                "max": 20
            }
        }
    }')
HTTP_CODE=${RESPONSE: -3}
if [ "$HTTP_CODE" -eq 400 ]; then
    print_result "Validation test (expected 400 error)"
else
    echo -e "${RED}✗ Validation test failed - expected 400 but got ${HTTP_CODE}${NC}"
    exit 1
fi

# Reset to defaults
echo "Resetting to defaults..."
RESET_RESPONSE=$(curl -s -X PUT "${BASE_URL}/universes/${UNIVERSE_ID}/physics/" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
        "physics_params": {
            "gravity": {
                "value": 9.81,
                "unit": "m/s²",
                "min": 0,
                "max": 20
            },
            "temperature": {
                "value": 293.15,
                "unit": "K",
                "min": 0,
                "max": 1000
            }
        }
    }')
echo "Reset response:"
echo "$RESET_RESPONSE" | jq '.'

echo "Verifying reset..."
echo "$RESET_RESPONSE" | jq -e '.physics_params.gravity.value == 9.81'
print_result "Reset to defaults" "$RESET_RESPONSE"

echo "Cleaning up test universe..."
DELETE_RESPONSE=$(curl -s -w "%{http_code}" -X DELETE "${BASE_URL}/universes/${UNIVERSE_ID}/" \
    -H "Authorization: Bearer ${TOKEN}")

HTTP_CODE=${DELETE_RESPONSE: -3}
if [ "$HTTP_CODE" -eq 204 ]; then
    print_result "Test universe cleanup"
else
    echo -e "${RED}✗ Test universe cleanup failed - expected 204 but got ${HTTP_CODE}${NC}"
    exit 1
fi

echo "All tests completed successfully!"

echo ""
echo "Bonus Features Status:"
echo "❌ 1. Music Generation - Not yet fully implemented. The universe structure includes harmony_params, but endpoints for music generation need to be added."
echo "❌ 2. Visualization - In progress. The universe structure includes visualization_params, but complete 3D visualization is not yet implemented."
echo "❌ 3. AI Integration - Framework in place via ai_params in the universe structure, but needs additional implementation for AI-assisted content generation."
echo ""
echo "While the core CRUD functionality for Universes, Scenes, and Physics Objects is complete, the bonus features are currently in development."
