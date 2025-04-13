#!/bin/bash

# =========================================
# Harmonic Universe - API Testing Tool
# =========================================
#
# This script helps test APIs in the Harmonic Universe backend

# Get script directory path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$ROOT_DIR")"

# Source core utilities
source "$PROJECT_ROOT/scripts/core.sh"
source "$PROJECT_ROOT/scripts/utils.sh"

# Welcome message
print_banner
log_info "Harmonic Universe API Testing Tool"

# Constants
REPORT_DIR="$ROOT_DIR/api-test-reports"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT_FILE="$REPORT_DIR/api-test-report-$TIMESTAMP.html"
API_CONFIG_FILE="$ROOT_DIR/api-tests.json"
TEMP_RESPONSE_FILE=$(mktemp)
TEMP_OUTPUT_FILE=$(mktemp)
TEMP_COOKIES_FILE=$(mktemp)

# Authentication variables
AUTH_TOKEN=""
AUTH_COOKIE=""

# Create reports directory if it doesn't exist
ensure_report_dir() {
    if [ ! -d "$REPORT_DIR" ]; then
        log_info "Creating reports directory at $REPORT_DIR"
        mkdir -p "$REPORT_DIR"
    fi
}

# Function to create a default API test configuration
create_default_config() {
    log_info "Creating default API test configuration..."
    
    if [ -f "$API_CONFIG_FILE" ]; then
        log_warning "API test configuration already exists at: $API_CONFIG_FILE"
        read -p "Do you want to overwrite it? (y/n): " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            log_info "Configuration not overwritten."
            return 0
        fi
    fi
    
    cat > "$API_CONFIG_FILE" << EOL
{
    "baseUrl": "http://localhost:5001",
    "tests": [
        {
            "name": "API Server Status",
            "description": "Check if the API server is running",
            "endpoint": "/api/status",
            "method": "GET",
            "headers": {},
            "body": {},
            "expectedStatus": 200,
            "expectedContains": ["success"],
            "saveResponse": false
        },
        {
            "name": "Login Test",
            "description": "Test user login API",
            "endpoint": "/api/auth/login",
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            "body": {
                "email": "test@example.com",
                "password": "password123"
            },
            "expectedStatus": 200,
            "expectedContains": ["token"],
            "saveResponse": true,
            "saveToken": {
                "path": "token",
                "as": "authToken"
            },
            "saveCookie": "session"
        },
        {
            "name": "Get User Profile",
            "description": "Test getting user profile with authentication",
            "endpoint": "/api/users/me",
            "method": "GET",
            "headers": {
                "Authorization": "Bearer {{authToken}}"
            },
            "cookies": ["session"],
            "expectedStatus": 200,
            "expectedContains": ["id", "email"],
            "saveResponse": false
        },
        {
            "name": "Create Resource",
            "description": "Test creating a new resource",
            "endpoint": "/api/resources",
            "method": "POST",
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer {{authToken}}"
            },
            "cookies": ["session"],
            "body": {
                "name": "Test Resource {{timestamp}}",
                "description": "This is a test resource created by the API test script"
            },
            "expectedStatus": 201,
            "expectedContains": ["id", "name", "created_at"],
            "saveResponse": true,
            "saveValue": {
                "path": "id",
                "as": "resourceId"
            }
        },
        {
            "name": "Get Resource",
            "description": "Test getting the created resource",
            "endpoint": "/api/resources/{{resourceId}}",
            "method": "GET",
            "headers": {
                "Authorization": "Bearer {{authToken}}"
            },
            "cookies": ["session"],
            "expectedStatus": 200,
            "expectedContains": ["name", "description"],
            "saveResponse": false
        },
        {
            "name": "Update Resource",
            "description": "Test updating the created resource",
            "endpoint": "/api/resources/{{resourceId}}",
            "method": "PUT",
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer {{authToken}}"
            },
            "cookies": ["session"],
            "body": {
                "name": "Updated Resource {{timestamp}}",
                "description": "This resource was updated by the API test script"
            },
            "expectedStatus": 200,
            "expectedContains": ["updated_at"],
            "saveResponse": false
        },
        {
            "name": "Delete Resource",
            "description": "Test deleting the created resource",
            "endpoint": "/api/resources/{{resourceId}}",
            "method": "DELETE",
            "headers": {
                "Authorization": "Bearer {{authToken}}"
            },
            "cookies": ["session"],
            "expectedStatus": 204,
            "saveResponse": false
        },
        {
            "name": "Logout Test",
            "description": "Test user logout API",
            "endpoint": "/api/auth/logout",
            "method": "POST",
            "headers": {
                "Authorization": "Bearer {{authToken}}"
            },
            "cookies": ["session"],
            "expectedStatus": 200,
            "expectedContains": ["success"],
            "saveResponse": false
        }
    ]
}
EOL
    
    log_success "Default API test configuration created at: $API_CONFIG_FILE"
    log_info "Please update the configuration with your actual API endpoints and parameters."
}

# Function to parse JSON values
parse_json_value() {
    local json=$1
    local path=$2
    
    # Simple dot notation parser for nested JSON values
    echo "$json" | grep -o "\"$path\":[^,}]*" | sed -E 's/"[^"]*":[ ]*"?([^",}]*)"?.*/\1/'
}

# Function to replace placeholders in strings
replace_placeholders() {
    local text=$1
    
    # Replace {{timestamp}} with current timestamp
    text=${text//\{\{timestamp\}\}/$TIMESTAMP}
    
    # Replace {{authToken}} with saved token
    text=${text//\{\{authToken\}\}/$AUTH_TOKEN}
    
    # Replace other saved values
    for key in "${!SAVED_VALUES[@]}"; do
        text=${text//\{\{$key\}\}/${SAVED_VALUES[$key]}}
    done
    
    echo "$text"
}

# Function to prepare request body
prepare_body() {
    local body_json=$1
    
    # Replace placeholders
    body_json=$(replace_placeholders "$body_json")
    
    echo "$body_json"
}

# Function to run API test
run_api_test() {
    local test_config=$1
    local base_url=$2
    
    # Extract test details
    local name=$(echo "$test_config" | grep -o '"name":"[^"]*"' | sed 's/"name":"//;s/"//')
    local endpoint=$(echo "$test_config" | grep -o '"endpoint":"[^"]*"' | sed 's/"endpoint":"//;s/"//')
    local method=$(echo "$test_config" | grep -o '"method":"[^"]*"' | sed 's/"method":"//;s/"//')
    local expected_status=$(echo "$test_config" | grep -o '"expectedStatus":[0-9]*' | sed 's/"expectedStatus"://')
    
    # Replace placeholders in endpoint
    endpoint=$(replace_placeholders "$endpoint")
    
    log_info "Running test: $name"
    log_info "  Endpoint: $method $endpoint"
    
    # Extract headers
    local headers=$(echo "$test_config" | sed -n '/"headers":{/,/}/p' | sed '1d;$d')
    
    # Extract body for POST/PUT requests
    local body=$(echo "$test_config" | sed -n '/"body":{/,/}/p' | sed '1d;$d')
    
    # Prepare curl command
    local curl_cmd="curl -s -X $method"
    
    # Add headers
    while IFS= read -r line; do
        if [[ $line =~ \"([^\"]+)\":\"([^\"]+)\" ]]; then
            header_name=${BASH_REMATCH[1]}
            header_value=${BASH_REMATCH[2]}
            
            # Replace placeholders in header value
            header_value=$(replace_placeholders "$header_value")
            
            curl_cmd+=" -H '$header_name: $header_value'"
        fi
    done <<< "$headers"
    
    # Add request body for POST/PUT
    if [ "$method" = "POST" ] || [ "$method" = "PUT" ] || [ "$method" = "PATCH" ]; then
        # Format body as JSON
        local formatted_body="{$(echo "$body" | sed -e 's/^[ \t]*//' -e 's/[ \t]*$//' -e 's/":/":/' -e 's/,$//')}"
        
        # Replace placeholders in body
        formatted_body=$(prepare_body "$formatted_body")
        
        # Escape quotes for curl command
        formatted_body=$(echo "$formatted_body" | sed 's/"/\\"/g')
        
        curl_cmd+=" -d \"$formatted_body\""
    fi
    
    # Add cookies if needed
    if [[ $test_config == *'"cookies":'* ]]; then
        curl_cmd+=" -b $TEMP_COOKIES_FILE"
    fi
    
    # Add cookie jar to save cookies
    curl_cmd+=" -c $TEMP_COOKIES_FILE"
    
    # Add full URL
    curl_cmd+=" '$base_url$endpoint'"
    
    # Add output file
    curl_cmd+=" -o $TEMP_RESPONSE_FILE"
    
    # Add response code check
    curl_cmd+=" -w '%{http_code}'"
    
    # Run the curl command
    log_info "  Executing request..."
    local status_code=$(eval "$curl_cmd")
    
    # Read the response body
    local response_body=$(cat "$TEMP_RESPONSE_FILE")
    
    # Log the response status and body
    log_info "  Response Status: $status_code"
    
    # Check status code
    if [ "$status_code" = "$expected_status" ]; then
        log_success "  Status code check passed: $status_code = $expected_status"
        echo "✅ Status code: $status_code = $expected_status" >> "$TEMP_OUTPUT_FILE"
    else
        log_error "  Status code check failed: $status_code ≠ $expected_status"
        echo "❌ Status code: $status_code ≠ $expected_status" >> "$TEMP_OUTPUT_FILE"
        TEST_FAILURES=$((TEST_FAILURES + 1))
    fi
    
    # Check for expected contents
    if [[ $test_config == *'"expectedContains":'* ]]; then
        local expected_contains=$(echo "$test_config" | sed -n '/"expectedContains":\[/,/\]/p' | sed '1s/.*\[//;$s/\].*//')
        
        while IFS= read -r expected_text; do
            expected_text=$(echo "$expected_text" | sed 's/^"//;s/",$//;s/"$//')
            
            if [[ $response_body == *"$expected_text"* ]]; then
                log_success "  Content check passed: contains '$expected_text'"
                echo "✅ Content check: contains '$expected_text'" >> "$TEMP_OUTPUT_FILE"
            else
                log_error "  Content check failed: does not contain '$expected_text'"
                echo "❌ Content check: does not contain '$expected_text'" >> "$TEMP_OUTPUT_FILE"
                TEST_FAILURES=$((TEST_FAILURES + 1))
            fi
        done <<< "$expected_contains"
    fi
    
    # Save response value if needed
    if [[ $test_config == *'"saveValue":'* ]]; then
        local save_path=$(echo "$test_config" | grep -o '"path":"[^"]*"' | sed 's/"path":"//;s/"//')
        local save_as=$(echo "$test_config" | grep -o '"as":"[^"]*"' | sed 's/"as":"//;s/"//')
        
        local saved_value=$(parse_json_value "$response_body" "$save_path")
        SAVED_VALUES["$save_as"]=$saved_value
        
        log_info "  Saved value: $save_as = $saved_value"
        echo "📝 Saved value: $save_as = $saved_value" >> "$TEMP_OUTPUT_FILE"
    fi
    
    # Save auth token if needed
    if [[ $test_config == *'"saveToken":'* ]]; then
        local token_path=$(echo "$test_config" | grep -o '"path":"[^"]*"' | sed -n '/"saveToken"/,/}/p' | sed 's/"path":"//;s/".*//')
        
        AUTH_TOKEN=$(parse_json_value "$response_body" "$token_path")
        
        log_info "  Saved auth token: $AUTH_TOKEN"
        echo "🔑 Saved auth token: $AUTH_TOKEN" >> "$TEMP_OUTPUT_FILE"
    fi
    
    # Save cookie if needed
    if [[ $test_config == *'"saveCookie":'* ]]; then
        local cookie_name=$(echo "$test_config" | grep -o '"saveCookie":"[^"]*"' | sed 's/"saveCookie":"//;s/"//')
        
        AUTH_COOKIE=$(grep "$cookie_name" "$TEMP_COOKIES_FILE" | tail -1)
        
        log_info "  Saved cookie: $cookie_name"
        echo "🍪 Saved cookie: $cookie_name" >> "$TEMP_OUTPUT_FILE"
    fi
    
    # Save full response if requested
    if [[ $test_config == *'"saveResponse":true'* ]]; then
        echo -e "\nResponse Body:\n$response_body" >> "$TEMP_OUTPUT_FILE"
    fi
    
    echo -e "\n" >> "$TEMP_OUTPUT_FILE"
    
    # Count test as completed
    TEST_COUNT=$((TEST_COUNT + 1))
}

# Function to run all API tests
run_all_tests() {
    log_info "Running all API tests..."
    
    # Check if configuration file exists
    if [ ! -f "$API_CONFIG_FILE" ]; then
        log_error "API test configuration not found at: $API_CONFIG_FILE"
        log_info "Creating a default configuration file..."
        create_default_config
        return 1
    fi
    
    # Reset counters
    TEST_COUNT=0
    TEST_FAILURES=0
    
    # Reset storage for saved values
    declare -A SAVED_VALUES
    
    # Extract base URL
    local base_url=$(grep -o '"baseUrl":"[^"]*"' "$API_CONFIG_FILE" | sed 's/"baseUrl":"//;s/"//')
    
    # Extract tests array
    local tests_json=$(sed -n '/"tests":\[/,/\]/p' "$API_CONFIG_FILE")
    
    # Split tests into individual objects
    local test_start_lines=$(grep -n "{" <<< "$tests_json" | cut -d: -f1)
    local test_end_lines=$(grep -n "}" <<< "$tests_json" | cut -d: -f1)
    
    # Combine start and end lines
    local test_ranges=()
    local i=0
    for start_line in $test_start_lines; do
        # Skip the first line which is the start of the "tests" array
        if [ $i -eq 0 ]; then
            i=$((i + 1))
            continue
        fi
        
        # Get the matching end line
        local end_line=$(echo "$test_end_lines" | awk "NR==$i")
        
        # Add to ranges
        test_ranges+=("$start_line,$end_line")
        
        i=$((i + 1))
    done
    
    # Clear the output file
    > "$TEMP_OUTPUT_FILE"
    
    # Run each test
    for range in "${test_ranges[@]}"; do
        local start_line=$(echo "$range" | cut -d, -f1)
        local end_line=$(echo "$range" | cut -d, -f2)
        
        # Extract test configuration
        local test_config=$(sed -n "${start_line},${end_line}p" <<< "$tests_json")
        
        # Run the test
        run_api_test "$test_config" "$base_url"
    done
    
    # Generate report
    generate_report
    
    # Print summary
    log_info "API tests completed: $TEST_COUNT total, $((TEST_COUNT - TEST_FAILURES)) passed, $TEST_FAILURES failed"
    
    # Return status
    if [ $TEST_FAILURES -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# Function to generate HTML report
generate_report() {
    log_info "Generating API test report..."
    
    # Calculate success rate
    local success_rate=0
    if [ $TEST_COUNT -gt 0 ]; then
        success_rate=$(( (TEST_COUNT - TEST_FAILURES) * 100 / TEST_COUNT ))
    fi
    
    # Generate HTML report
    cat > "$REPORT_FILE" << EOL
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe API Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
        h1 { color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        h2 { color: #3498db; margin-top: 20px; }
        .summary { display: flex; justify-content: space-between; background-color: #f5f7fa; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
        .summary div { text-align: center; padding: 0 10px; }
        .summary h3 { margin: 0; }
        .success-count { font-size: 24px; font-weight: bold; color: #2ecc71; }
        .failure-count { font-size: 24px; font-weight: bold; color: #e74c3c; }
        .total-count { font-size: 24px; font-weight: bold; color: #3498db; }
        .success-rate { font-size: 24px; font-weight: bold; }
        .success-rate.good { color: #2ecc71; }
        .success-rate.medium { color: #f39c12; }
        .success-rate.bad { color: #e74c3c; }
        .section { background-color: #fff; padding: 15px; margin-bottom: 15px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        pre { background-color: #f8f8f8; padding: 10px; overflow: auto; border-radius: 4px; }
        .pass { color: #2ecc71; }
        .fail { color: #e74c3c; }
        .info { color: #3498db; }
    </style>
</head>
<body>
    <h1>Harmonic Universe API Test Report</h1>
    <p>Generated on: $(date)</p>
    
    <div class="summary">
        <div>
            <h3>Total Tests</h3>
            <p class="total-count">$TEST_COUNT</p>
        </div>
        <div>
            <h3>Passed</h3>
            <p class="success-count">$((TEST_COUNT - TEST_FAILURES))</p>
        </div>
        <div>
            <h3>Failed</h3>
            <p class="failure-count">$TEST_FAILURES</p>
        </div>
        <div>
            <h3>Success Rate</h3>
            <p class="success-rate $([ $success_rate -ge 90 ] && echo 'good' || ([ $success_rate -ge 70 ] && echo 'medium' || echo 'bad'))">$success_rate%</p>
        </div>
    </div>
    
    <div class="section">
        <h2>Test Results</h2>
        <pre>$(cat "$TEMP_OUTPUT_FILE" | sed 's/✅/<span class="pass">✅<\/span>/g' | sed 's/❌/<span class="fail">❌<\/span>/g' | sed 's/📝/<span class="info">📝<\/span>/g' | sed 's/🔑/<span class="info">🔑<\/span>/g' | sed 's/🍪/<span class="info">🍪<\/span>/g')</pre>
    </div>
</body>
</html>
EOL
    
    log_success "API test report generated at: $REPORT_FILE"
    
    # Open the report in the default browser if on a desktop
    if command -v open &> /dev/null; then
        open "$REPORT_FILE"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "$REPORT_FILE"
    elif command -v start &> /dev/null; then
        start "$REPORT_FILE"
    else
        log_warning "Unable to open the report automatically. Please open it manually at: $REPORT_FILE"
    fi
}

# Main function
main() {
    # Ensure report directory exists
    ensure_report_dir
    
    if [ $# -eq 0 ]; then
        # Show help if no arguments provided
        log_info "Usage: $0 [run|create]"
        log_info "  run     - Run all API tests"
        log_info "  create  - Create default API test configuration"
        exit 0
    fi
    
    # Process arguments
    case "$1" in
        run)
            run_all_tests
            ;;
        create)
            create_default_config
            ;;
        *)
            log_error "Unknown command: $1"
            log_info "Usage: $0 [run|create]"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"

# Clean up temporary files
rm -f "$TEMP_RESPONSE_FILE" "$TEMP_OUTPUT_FILE" "$TEMP_COOKIES_FILE" 