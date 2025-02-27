#!/bin/bash

# test_all_features.sh
# Comprehensive test script for all features and CRUD operations

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Base URL for API
BASE_URL="http://localhost:5000/api"

# Test data
TEST_EMAIL="test@example.com"
TEST_PASSWORD="testpassword123"
TEST_USERNAME="testuser"

echo -e "${BLUE}=== Harmonic Universe Feature Tests ===${NC}\n"

# Helper function for HTTP requests
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
                -H "Authorization: Bearer $auth_header" \
                "${BASE_URL}${endpoint}")
        else
            response=$(curl -s -w "\n%{http_code}" \
                "${BASE_URL}${endpoint}")
        fi
    fi

    echo "$response"
}

# Function to run test suite
run_test_suite() {
    local suite_name=$1
    local test_fn=$2

    echo -e "\n${BLUE}=== Running $suite_name Tests ===${NC}"
    if $test_fn; then
        echo -e "${GREEN}✓ $suite_name tests passed${NC}"
        return 0
    else
        echo -e "${RED}✗ $suite_name tests failed${NC}"
        return 1
    fi
}

# Authentication Tests
test_auth() {
    echo -e "\n${YELLOW}Testing Authentication...${NC}"

    # Register
    local register_response=$(make_request "POST" "/auth/register" \
        "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"username\":\"$TEST_USERNAME\"}")

    # Login
    local login_response=$(make_request "POST" "/auth/login" \
        "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

    ACCESS_TOKEN=$(echo $login_response | jq -r '.access_token')

    if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
        echo -e "${RED}Failed to get access token${NC}"
        return 1
    fi

    echo -e "${GREEN}Authentication tests passed${NC}"
    return 0
}

# Universe Tests
test_universe() {
    echo -e "\n${YELLOW}Testing Universe Management...${NC}"

    # Create Universe
    local universe_data="{
        \"name\": \"Test Universe\",
        \"description\": \"Test Description\",
        \"physics_settings\": {
            \"gravity\": 9.81,
            \"time_scale\": 1.0
        },
        \"harmony_settings\": {
            \"base_frequency\": 440,
            \"scale\": \"major\"
        }
    }"

    local create_response=$(make_request "POST" "/universes" "$universe_data" "$ACCESS_TOKEN")
    UNIVERSE_ID=$(echo $create_response | jq -r '.id')

    if [ -z "$UNIVERSE_ID" ] || [ "$UNIVERSE_ID" = "null" ]; then
        echo -e "${RED}Failed to create universe${NC}"
        return 1
    fi

    # Test other universe operations
    make_request "GET" "/universes/$UNIVERSE_ID" "" "$ACCESS_TOKEN"
    make_request "PUT" "/universes/$UNIVERSE_ID" \
        "{\"name\":\"Updated Universe\"}" "$ACCESS_TOKEN"
    make_request "GET" "/universes" "" "$ACCESS_TOKEN"

    echo -e "${GREEN}Universe tests passed${NC}"
    return 0
}

# Physics Parameters Tests
test_physics_parameters() {
    echo -e "\n${YELLOW}Testing Physics Parameters...${NC}"

    local params_data="{
        \"name\": \"Test Parameters\",
        \"universe_id\": \"$UNIVERSE_ID\",
        \"gravity\": 9.81,
        \"time_scale\": 1.0,
        \"air_resistance\": 0.1
    }"

    local create_response=$(make_request "POST" "/physics-parameters" "$params_data" "$ACCESS_TOKEN")
    local PARAMS_ID=$(echo $create_response | jq -r '.id')

    if [ -z "$PARAMS_ID" ] || [ "$PARAMS_ID" = "null" ]; then
        echo -e "${RED}Failed to create physics parameters${NC}"
        return 1
    fi

    # Test other physics parameters operations
    make_request "GET" "/physics-parameters/$PARAMS_ID" "" "$ACCESS_TOKEN"
    make_request "PUT" "/physics-parameters/$PARAMS_ID" \
        "{\"gravity\":8.0}" "$ACCESS_TOKEN"
    make_request "GET" "/physics-parameters/universe/$UNIVERSE_ID" "" "$ACCESS_TOKEN"
    make_request "DELETE" "/physics-parameters/$PARAMS_ID" "" "$ACCESS_TOKEN"

    echo -e "${GREEN}Physics parameters tests passed${NC}"
    return 0
}

# Scene Tests
test_scenes() {
    echo -e "\n${YELLOW}Testing Scene Management...${NC}"

    local scene_data="{
        \"name\": \"Test Scene\",
        \"universe_id\": \"$UNIVERSE_ID\",
        \"properties\": {
            \"background\": \"space\",
            \"ambient_light\": 0.5
        }
    }"

    local create_response=$(make_request "POST" "/scenes" "$scene_data" "$ACCESS_TOKEN")
    local SCENE_ID=$(echo $create_response | jq -r '.id')

    if [ -z "$SCENE_ID" ] || [ "$SCENE_ID" = "null" ]; then
        echo -e "${RED}Failed to create scene${NC}"
        return 1
    fi

    # Test other scene operations
    make_request "GET" "/scenes/$SCENE_ID" "" "$ACCESS_TOKEN"
    make_request "PUT" "/scenes/$SCENE_ID" \
        "{\"name\":\"Updated Scene\"}" "$ACCESS_TOKEN"
    make_request "GET" "/universes/$UNIVERSE_ID/scenes" "" "$ACCESS_TOKEN"
    make_request "DELETE" "/scenes/$SCENE_ID" "" "$ACCESS_TOKEN"

    echo -e "${GREEN}Scene tests passed${NC}"
    return 0
}

# Music Generation Tests
test_music() {
    echo -e "\n${YELLOW}Testing Music Generation...${NC}"

    local music_data="{
        \"universe_id\": \"$UNIVERSE_ID\",
        \"settings\": {
            \"tempo\": 120,
            \"key\": \"C\",
            \"scale\": \"major\",
            \"harmony_value\": 0.7
        }
    }"

    local create_response=$(make_request "POST" "/music/generate" "$music_data" "$ACCESS_TOKEN")
    local MUSIC_ID=$(echo $create_response | jq -r '.id')

    if [ -z "$MUSIC_ID" ] || [ "$MUSIC_ID" = "null" ]; then
        echo -e "${RED}Failed to generate music${NC}"
        return 1
    fi

    # Test other music operations
    make_request "GET" "/music/$MUSIC_ID" "" "$ACCESS_TOKEN"
    make_request "PUT" "/music/$MUSIC_ID/settings" \
        "{\"tempo\":140}" "$ACCESS_TOKEN"
    make_request "DELETE" "/music/$MUSIC_ID" "" "$ACCESS_TOKEN"

    echo -e "${GREEN}Music generation tests passed${NC}"
    return 0
}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Running cleanup...${NC}"

    # Delete Universe (cascades to all related objects)
    make_request "DELETE" "/universes/$UNIVERSE_ID" "" "$ACCESS_TOKEN"

    # Logout
    make_request "POST" "/auth/logout" "" "$ACCESS_TOKEN"

    echo -e "${GREEN}Cleanup completed${NC}"
}

# Main test execution
main() {
    echo -e "${BLUE}Starting comprehensive feature tests...${NC}\n"

    # Initialize error counter
    local errors=0

    # Run test suites
    run_test_suite "Authentication" test_auth || ((errors++))
    run_test_suite "Universe Management" test_universe || ((errors++))
    run_test_suite "Physics Parameters" test_physics_parameters || ((errors++))
    run_test_suite "Scene Management" test_scenes || ((errors++))
    run_test_suite "Music Generation" test_music || ((errors++))

    # Run cleanup
    cleanup

    # Final results
    echo -e "\n${BLUE}=== Test Results ===${NC}"
    if [ $errors -eq 0 ]; then
        echo -e "${GREEN}All test suites passed successfully!${NC}"
        exit 0
    else
        echo -e "${RED}$errors test suite(s) failed${NC}"
        exit 1
    fi
}

# Execute main function
main
