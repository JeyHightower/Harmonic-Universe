#!/bin/bash

# =========================================
# Harmonic Universe - Error Logging Utility
# =========================================
#
# This script provides utilities for capturing, analyzing, and reporting errors

# Source core utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/core.sh"
source "$SCRIPT_DIR/utils.sh"

# Welcome message
print_banner
log_info "Harmonic Universe Error Logger"

# Constants
LOG_DIR="$ROOT_DIR/logs"
FRONTEND_LOG="$LOG_DIR/frontend-errors.log"
BACKEND_LOG="$LOG_DIR/backend-errors.log"
BUILD_LOG="$LOG_DIR/build-errors.log"
GENERAL_LOG="$LOG_DIR/general-errors.log"

# Ensure log directory exists
ensure_logs_dir() {
    if [ ! -d "$LOG_DIR" ]; then
        log_info "Creating logs directory at $LOG_DIR"
        mkdir -p "$LOG_DIR"
    fi
    
    # Create log files if they don't exist
    touch "$FRONTEND_LOG"
    touch "$BACKEND_LOG"
    touch "$BUILD_LOG"
    touch "$GENERAL_LOG"
}

# Function to monitor frontend logs for errors
monitor_frontend_errors() {
    log_info "Monitoring frontend for errors..."
    
    # Change to frontend directory
    cd "$ROOT_DIR/frontend"
    
    # Determine package manager
    PM=$(get_package_manager ".")
    
    # Start dev server with output redirection
    log_info "Starting frontend dev server with error logging..."
    
    # Create temporary log file
    TEMP_LOG=$(mktemp)
    
    case "$PM" in
        pnpm)
            pnpm run dev 2>&1 | tee "$TEMP_LOG" &
            ;;
        yarn)
            yarn dev 2>&1 | tee "$TEMP_LOG" &
            ;;
        npm)
            npm run dev 2>&1 | tee "$TEMP_LOG" &
            ;;
    esac
    
    PID=$!
    
    # Set up a trap to clean up on script exit
    trap 'kill $PID 2>/dev/null; rm -f "$TEMP_LOG"; exit' INT TERM EXIT
    
    # Monitor the log file for errors
    log_info "Monitoring logs for errors. Press Ctrl+C to stop."
    
    tail -f "$TEMP_LOG" | grep -i -E "error|exception|failed|warning" | while read -r line; do
        echo "[$(date +"%Y-%m-%d %H:%M:%S")] $line" >> "$FRONTEND_LOG"
        log_error "Frontend Error: $line"
    done
}

# Function to monitor backend logs for errors
monitor_backend_errors() {
    log_info "Monitoring backend for errors..."
    
    # Change to backend directory
    cd "$ROOT_DIR/backend"
    
    # Start Flask server with output redirection
    log_info "Starting backend server with error logging..."
    
    # Create temporary log file
    TEMP_LOG=$(mktemp)
    
    # Activate virtual environment if it exists
    if [ -d "venv" ]; then
        source venv/bin/activate
    fi
    
    # Start Flask server
    FLASK_ENV=development FLASK_DEBUG=1 python -m flask run 2>&1 | tee "$TEMP_LOG" &
    PID=$!
    
    # Set up a trap to clean up on script exit
    trap 'kill $PID 2>/dev/null; rm -f "$TEMP_LOG"; exit' INT TERM EXIT
    
    # Monitor the log file for errors
    log_info "Monitoring logs for errors. Press Ctrl+C to stop."
    
    tail -f "$TEMP_LOG" | grep -i -E "error|exception|failed|warning" | while read -r line; do
        echo "[$(date +"%Y-%m-%d %H:%M:%S")] $line" >> "$BACKEND_LOG"
        log_error "Backend Error: $line"
    done
}

# Function to analyze error logs and generate report
analyze_logs() {
    log_info "Analyzing error logs..."
    
    # Create report directory
    REPORT_DIR="$LOG_DIR/reports"
    mkdir -p "$REPORT_DIR"
    
    # Generate timestamp for report
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    REPORT_FILE="$REPORT_DIR/error-report-$TIMESTAMP.html"
    
    # Count errors by type
    FRONTEND_COUNT=$(grep -c -i "error" "$FRONTEND_LOG")
    BACKEND_COUNT=$(grep -c -i "error" "$BACKEND_LOG")
    BUILD_COUNT=$(grep -c -i "error" "$BUILD_LOG")
    
    # Count warnings
    FRONTEND_WARNINGS=$(grep -c -i "warning" "$FRONTEND_LOG")
    BACKEND_WARNINGS=$(grep -c -i "warning" "$BACKEND_LOG")
    BUILD_WARNINGS=$(grep -c -i "warning" "$BUILD_LOG")
    
    # Find most common errors
    FRONTEND_COMMON=$(grep -i "error" "$FRONTEND_LOG" | sort | uniq -c | sort -nr | head -5)
    BACKEND_COMMON=$(grep -i "error" "$BACKEND_LOG" | sort | uniq -c | sort -nr | head -5)
    BUILD_COMMON=$(grep -i "error" "$BUILD_LOG" | sort | uniq -c | sort -nr | head -5)
    
    # Generate HTML report
    cat > "$REPORT_FILE" << EOL
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe Error Report</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
        h1 { color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        h2 { color: #3498db; margin-top: 20px; }
        .summary { display: flex; justify-content: space-between; background-color: #f5f7fa; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
        .summary div { text-align: center; padding: 0 10px; }
        .summary h3 { margin: 0; }
        .error-count { font-size: 24px; font-weight: bold; color: #e74c3c; }
        .warning-count { font-size: 24px; font-weight: bold; color: #f39c12; }
        .section { background-color: #fff; padding: 15px; margin-bottom: 15px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .log-entry { font-family: monospace; background-color: #f8f8f8; padding: 8px; margin: 5px 0; border-radius: 3px; white-space: pre-wrap; word-break: break-word; }
        pre { margin: 0; }
        .tabs { display: flex; margin-bottom: 15px; }
        .tab { padding: 10px 15px; background-color: #eee; cursor: pointer; margin-right: 5px; border-radius: 4px 4px 0 0; }
        .tab.active { background-color: #3498db; color: white; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
    </style>
</head>
<body>
    <h1>Harmonic Universe Error Report</h1>
    <p>Generated on: $(date)</p>
    
    <div class="summary">
        <div>
            <h3>Frontend Errors</h3>
            <p class="error-count">$FRONTEND_COUNT</p>
            <p class="warning-count">$FRONTEND_WARNINGS warnings</p>
        </div>
        <div>
            <h3>Backend Errors</h3>
            <p class="error-count">$BACKEND_COUNT</p>
            <p class="warning-count">$BACKEND_WARNINGS warnings</p>
        </div>
        <div>
            <h3>Build Errors</h3>
            <p class="error-count">$BUILD_COUNT</p>
            <p class="warning-count">$BUILD_WARNINGS warnings</p>
        </div>
    </div>
    
    <div class="tabs">
        <div class="tab active" onclick="openTab(event, 'frontend')">Frontend</div>
        <div class="tab" onclick="openTab(event, 'backend')">Backend</div>
        <div class="tab" onclick="openTab(event, 'build')">Build</div>
    </div>
    
    <div id="frontend" class="tab-content active">
        <div class="section">
            <h2>Most Common Frontend Errors</h2>
            <pre>
$FRONTEND_COMMON
            </pre>
        </div>
        
        <div class="section">
            <h2>Recent Frontend Errors</h2>
            $(tail -n 20 "$FRONTEND_LOG" | while read -r line; do
                echo "<div class=\"log-entry\">$line</div>"
            done)
        </div>
    </div>
    
    <div id="backend" class="tab-content">
        <div class="section">
            <h2>Most Common Backend Errors</h2>
            <pre>
$BACKEND_COMMON
            </pre>
        </div>
        
        <div class="section">
            <h2>Recent Backend Errors</h2>
            $(tail -n 20 "$BACKEND_LOG" | while read -r line; do
                echo "<div class=\"log-entry\">$line</div>"
            done)
        </div>
    </div>
    
    <div id="build" class="tab-content">
        <div class="section">
            <h2>Most Common Build Errors</h2>
            <pre>
$BUILD_COMMON
            </pre>
        </div>
        
        <div class="section">
            <h2>Recent Build Errors</h2>
            $(tail -n 20 "$BUILD_LOG" | while read -r line; do
                echo "<div class=\"log-entry\">$line</div>"
            done)
        </div>
    </div>
    
    <script>
        function openTab(evt, tabName) {
            var i, tabcontent, tablinks;
            
            // Hide all tab content
            tabcontent = document.getElementsByClassName("tab-content");
            for (i = 0; i < tabcontent.length; i++) {
                tabcontent[i].className = tabcontent[i].className.replace(" active", "");
            }
            
            // Remove active class from all tabs
            tablinks = document.getElementsByClassName("tab");
            for (i = 0; i < tablinks.length; i++) {
                tablinks[i].className = tablinks[i].className.replace(" active", "");
            }
            
            // Show the current tab and add active class
            document.getElementById(tabName).className += " active";
            evt.currentTarget.className += " active";
        }
    </script>
</body>
</html>
EOL
    
    log_success "Error analysis complete. Report generated at: $REPORT_FILE"
    
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

# Function to capture build errors
capture_build_errors() {
    log_info "Capturing build errors..."
    
    # Get build type
    local build_type="$1"
    
    if [ -z "$build_type" ]; then
        log_error "Build type must be specified: frontend, backend, or all"
        return 1
    fi
    
    case "$build_type" in
        frontend)
            log_info "Building frontend with error capture..."
            cd "$ROOT_DIR/frontend"
            
            # Determine package manager
            PM=$(get_package_manager ".")
            
            case "$PM" in
                pnpm)
                    pnpm run build 2>&1 | tee -a "$BUILD_LOG"
                    ;;
                yarn)
                    yarn build 2>&1 | tee -a "$BUILD_LOG"
                    ;;
                npm)
                    npm run build 2>&1 | tee -a "$BUILD_LOG"
                    ;;
            esac
            ;;
            
        backend)
            log_info "Building backend with error capture..."
            # Typically no build step for Flask, but could include database migrations
            cd "$ROOT_DIR/backend"
            
            # Activate virtual environment if it exists
            if [ -d "venv" ]; then
                source venv/bin/activate
            fi
            
            # Run migrations
            python -m flask db upgrade 2>&1 | tee -a "$BUILD_LOG"
            ;;
            
        all)
            log_info "Building entire project with error capture..."
            # Build backend first
            capture_build_errors "backend"
            # Then build frontend
            capture_build_errors "frontend"
            ;;
            
        *)
            log_error "Unknown build type: $build_type"
            log_info "Usage: $0 capture-build [frontend|backend|all]"
            return 1
            ;;
    esac
    
    log_success "Build completed and errors captured in $BUILD_LOG"
}

# Function to clear logs
clear_logs() {
    log_info "Clearing error logs..."
    
    # Confirm with user
    read -p "Are you sure you want to clear all error logs? (y/n): " confirm
    
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        > "$FRONTEND_LOG"
        > "$BACKEND_LOG"
        > "$BUILD_LOG"
        > "$GENERAL_LOG"
        log_success "All logs cleared."
    else
        log_info "Logs not cleared."
    fi
}

# Main function
main() {
    # Ensure log directory exists
    ensure_logs_dir
    
    if [ $# -eq 0 ]; then
        # Show help if no arguments provided
        log_info "Usage: $0 [frontend|backend|analyze|capture-build TYPE|clear]"
        exit 0
    fi
    
    # Process arguments
    case "$1" in
        frontend)
            monitor_frontend_errors
            ;;
        backend)
            monitor_backend_errors
            ;;
        analyze)
            analyze_logs
            ;;
        capture-build)
            if [ -z "$2" ]; then
                log_error "Build type must be specified: frontend, backend, or all"
                log_info "Usage: $0 capture-build [frontend|backend|all]"
                exit 1
            fi
            capture_build_errors "$2"
            ;;
        clear)
            clear_logs
            ;;
        *)
            log_error "Unknown command: $1"
            log_info "Usage: $0 [frontend|backend|analyze|capture-build TYPE|clear]"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 