#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL (update this with your actual API base URL)
BASE_URL="http://localhost:5001/api"

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        echo -e "${YELLOW}Response:${NC}"
        cat response.txt
    fi
}

# Function to check if server is running
check_server() {
    if curl -s "${BASE_URL}/health" > /dev/null; then
        echo -e "${GREEN}Server is running${NC}"
        return 0
    else
        echo -e "${RED}Server is not running. Please start the server first.${NC}"
        return 1
    fi
}

# Function to get JWT token
get_token() {
    local response=$(curl -s -X POST "${BASE_URL}/auth/demo-login" \
        -H "Content-Type: application/json" \
        -d '{"email": "demo@example.com", "password": "demo123"}')
    
    echo $response | grep -o '"token":"[^"]*' | cut -d'"' -f4
}

# Check if server is running
if ! check_server; then
    exit 1
fi

# Get JWT token
echo "Getting JWT token..."
TOKEN=$(get_token)
if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to get JWT token${NC}"
    exit 1
fi

# Common headers
HEADERS=(
    "-H" "Content-Type: application/json"
    "-H" "Authorization: Bearer ${TOKEN}"
)

# Test 1: Open Alert Modal
echo "Testing Alert Modal..."
curl -X POST "${BASE_URL}/modal/open" \
     "${HEADERS[@]}" \
     -d '{
       "type": "ALERT",
       "props": {
         "title": "Test Alert",
         "message": "This is a test alert message",
         "confirmText": "OK"
       }
     }' > response.txt 2>&1
print_result $? "Open Alert Modal"

# Test 2: Open Confirmation Modal
echo "Testing Confirmation Modal..."
curl -X POST "${BASE_URL}/modal/open" \
     "${HEADERS[@]}" \
     -d '{
       "type": "CONFIRMATION",
       "props": {
         "title": "Test Confirmation",
         "message": "Are you sure you want to proceed?",
         "confirmText": "Yes",
         "cancelText": "No"
       }
     }' > response.txt 2>&1
print_result $? "Open Confirmation Modal"

# Test 3: Open Form Modal
echo "Testing Form Modal..."
curl -X POST "${BASE_URL}/modal/open" \
     "${HEADERS[@]}" \
     -d '{
       "type": "FORM",
       "props": {
         "title": "Test Form",
         "fields": [
           {
             "name": "username",
             "type": "text",
             "label": "Username"
           },
           {
             "name": "password",
             "type": "password",
             "label": "Password"
           }
         ]
       }
     }' > response.txt 2>&1
print_result $? "Open Form Modal"

# Test 4: Open Network Error Modal
echo "Testing Network Error Modal..."
curl -X POST "${BASE_URL}/modal/open" \
     "${HEADERS[@]}" \
     -d '{
       "type": "NETWORK_ERROR",
       "props": {
         "message": "Connection error occurred"
       }
     }' > response.txt 2>&1
print_result $? "Open Network Error Modal"

# Test 5: Update Modal Props
echo "Testing Update Modal Props..."
curl -X PUT "${BASE_URL}/modal/props" \
     "${HEADERS[@]}" \
     -d '{
       "draggable": true,
       "closeOnEscape": false,
       "preventBodyScroll": true
     }' > response.txt 2>&1
print_result $? "Update Modal Props"

# Test 6: Close Modal
echo "Testing Close Modal..."
curl -X POST "${BASE_URL}/modal/close" \
     "${HEADERS[@]}" > response.txt 2>&1
print_result $? "Close Modal"

# Test 7: Get Modal State
echo "Testing Get Modal State..."
curl -X GET "${BASE_URL}/modal/state" \
     "${HEADERS[@]}" > response.txt 2>&1
print_result $? "Get Modal State"

# Test 8: Invalid Modal Type
echo "Testing Invalid Modal Type..."
curl -X POST "${BASE_URL}/modal/open" \
     "${HEADERS[@]}" \
     -d '{
       "type": "INVALID_TYPE",
       "props": {
         "title": "Invalid Modal"
       }
     }' > response.txt 2>&1
print_result $? "Invalid Modal Type"

# Test 9: Modal Transition State
echo "Testing Modal Transition State..."
curl -X GET "${BASE_URL}/modal/transition" \
     "${HEADERS[@]}" > response.txt 2>&1
print_result $? "Get Modal Transition State"

# Test 10: Multiple Modal Stack
echo "Testing Multiple Modal Stack..."
curl -X POST "${BASE_URL}/modal/open" \
     "${HEADERS[@]}" \
     -d '{
       "type": "ALERT",
       "props": {
         "title": "First Modal",
         "message": "This is the first modal"
       }
     }' > response.txt 2>&1

curl -X POST "${BASE_URL}/modal/open" \
     "${HEADERS[@]}" \
     -d '{
       "type": "CONFIRMATION",
       "props": {
         "title": "Second Modal",
         "message": "This is the second modal"
       }
     }' > response.txt 2>&1
print_result $? "Multiple Modal Stack"

# Test 11: Modal with Custom Animation
echo "Testing Modal with Custom Animation..."
curl -X POST "${BASE_URL}/modal/open" \
     "${HEADERS[@]}" \
     -d '{
       "type": "ALERT",
       "props": {
         "title": "Animated Modal",
         "message": "This modal has custom animation",
         "animation": "SLIDE"
       }
     }' > response.txt 2>&1
print_result $? "Modal with Custom Animation"

# Test 12: Modal with Custom Position
echo "Testing Modal with Custom Position..."
curl -X POST "${BASE_URL}/modal/open" \
     "${HEADERS[@]}" \
     -d '{
       "type": "ALERT",
       "props": {
         "title": "Positioned Modal",
         "message": "This modal has custom position",
         "position": "TOP"
       }
     }' > response.txt 2>&1
print_result $? "Modal with Custom Position"

# Test 13: Modal with Custom Size
echo "Testing Modal with Custom Size..."
curl -X POST "${BASE_URL}/modal/open" \
     "${HEADERS[@]}" \
     -d '{
       "type": "ALERT",
       "props": {
         "title": "Sized Modal",
         "message": "This modal has custom size",
         "size": "LARGE"
       }
     }' > response.txt 2>&1
print_result $? "Modal with Custom Size"

# Test 14: Modal with Prevent Auto Close
echo "Testing Modal with Prevent Auto Close..."
curl -X POST "${BASE_URL}/modal/open" \
     "${HEADERS[@]}" \
     -d '{
       "type": "ALERT",
       "props": {
         "title": "Protected Modal",
         "message": "This modal cannot be closed automatically",
         "preventAutoClose": true
       }
     }' > response.txt 2>&1
print_result $? "Modal with Prevent Auto Close"

# Test 15: Modal with Custom Footer
echo "Testing Modal with Custom Footer..."
curl -X POST "${BASE_URL}/modal/open" \
     "${HEADERS[@]}" \
     -d '{
       "type": "ALERT",
       "props": {
         "title": "Footer Modal",
         "message": "This modal has a custom footer",
         "footerContent": {
           "buttons": [
             {
               "text": "Custom Button",
               "action": "customAction"
             }
           ]
         }
       }
     }' > response.txt 2>&1
print_result $? "Modal with Custom Footer"

# Clean up
rm -f response.txt

echo "All modal tests completed!" 