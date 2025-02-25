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

# Test DELETE
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

echo "All tests completed successfully!"
