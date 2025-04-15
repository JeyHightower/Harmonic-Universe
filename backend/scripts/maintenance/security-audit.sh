#!/bin/bash

# =========================================
# Harmonic Universe - Security Audit Tool
# =========================================
#
# This script performs security audits on the codebase

# Source core utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/core.sh"
source "$SCRIPT_DIR/utils.sh"

# Welcome message
print_banner
log_info "Harmonic Universe Security Audit Tool"

# Constants
REPORT_DIR="$ROOT_DIR/security-reports"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT_FILE="$REPORT_DIR/security-report-$TIMESTAMP.html"

# Create reports directory if it doesn't exist
ensure_report_dir() {
    if [ ! -d "$REPORT_DIR" ]; then
        log_info "Creating reports directory at $REPORT_DIR"
        mkdir -p "$REPORT_DIR"
    fi
}

# Function to check for exposed secrets
check_exposed_secrets() {
    log_info "Checking for exposed secrets..."
    
    # Create temporary file to store results
    SECRETS_FILE=$(mktemp)
    
    # Search patterns for common secrets
    log_info "Scanning for API keys, tokens, and credentials..."
    {
        # Look for API keys
        grep -r -n -E 'api_?key|api.?secret|access.?key|auth.?token|client.?secret|private.?key' \
            --include="*.{js,ts,jsx,tsx,py,json,yml,yaml,env,cfg,rb,php,html,css}" \
            --exclude-dir={node_modules,myenv,dist,build,__pycache__,coverage,.git} \
            "$ROOT_DIR" 2>/dev/null
        
        # Look for potential AWS keys
        grep -r -n -E 'AKIA[0-9A-Z]{16}' \
            --include="*.{js,ts,jsx,tsx,py,json,yml,yaml,env,cfg,rb,php,html,css}" \
            --exclude-dir={node_modules,myenv,dist,build,__pycache__,coverage,.git} \
            "$ROOT_DIR" 2>/dev/null
        
        # Look for potential passwords
        grep -r -n -E 'password\s*=\s*[\'"][^\'"]+[\'"]|pass\s*=\s*[\'"][^\'"]+[\'"]' \
            --include="*.{js,ts,jsx,tsx,py,json,yml,yaml,env,cfg,rb,php,html,css}" \
            --exclude-dir={node_modules,myenv,dist,build,__pycache__,coverage,.git} \
            "$ROOT_DIR" 2>/dev/null
        
        # Look for private keys
        grep -r -n -E '-----BEGIN .* PRIVATE KEY-----' \
            --include="*.{js,ts,jsx,tsx,py,json,yml,yaml,env,cfg,rb,php,html,css}" \
            --exclude-dir={node_modules,myenv,dist,build,__pycache__,coverage,.git} \
            "$ROOT_DIR" 2>/dev/null
    } > "$SECRETS_FILE"
    
    # Count findings
    SECRETS_COUNT=$(wc -l < "$SECRETS_FILE")
    
    log_info "Found $SECRETS_COUNT potential secrets."
    
    return 0
}

# Function to check for outdated dependencies
check_outdated_deps() {
    log_info "Checking for outdated dependencies..."
    
    # Create temporary files to store results
    NPM_OUTDATED_FILE=$(mktemp)
    PIP_OUTDATED_FILE=$(mktemp)
    
    # Check frontend dependencies
    if [ -d "$ROOT_DIR/frontend" ]; then
        log_info "Checking frontend dependencies..."
        cd "$ROOT_DIR/frontend"
        
        # Determine package manager
        PM=$(get_package_manager ".")
        
        # Check for outdated packages
        case "$PM" in
            pnpm)
                pnpm outdated --format json > "$NPM_OUTDATED_FILE" 2>/dev/null
                ;;
            yarn)
                yarn outdated --json > "$NPM_OUTDATED_FILE" 2>/dev/null
                ;;
            npm)
                npm outdated --json > "$NPM_OUTDATED_FILE" 2>/dev/null
                ;;
        esac
    fi
    
    # Check backend dependencies
    if [ -d "$ROOT_DIR/backend" ]; then
        log_info "Checking backend dependencies..."
        cd "$ROOT_DIR/backend"
        
        # Check if virtual environment exists
        if [ -d "myenv" ]; then
            # Activate virtual environment
            source myenv/bin/activate
            
            # Check for outdated packages
            pip list --outdated --format=json > "$PIP_OUTDATED_FILE" 2>/dev/null
            
            # Deactivate virtual environment
            deactivate
        else
            log_warning "Python virtual environment not found. Skipping backend dependency check."
        fi
    fi
    
    # Count findings
    if [ -s "$NPM_OUTDATED_FILE" ]; then
        NPM_OUTDATED_COUNT=$(grep -o -E '"[^"]+"' "$NPM_OUTDATED_FILE" | wc -l)
        NPM_OUTDATED_COUNT=$((NPM_OUTDATED_COUNT / 4)) # Approximate count based on JSON structure
    else
        NPM_OUTDATED_COUNT=0
    fi
    
    if [ -s "$PIP_OUTDATED_FILE" ]; then
        PIP_OUTDATED_COUNT=$(grep -o -E '"name":' "$PIP_OUTDATED_FILE" | wc -l)
    else
        PIP_OUTDATED_COUNT=0
    fi
    
    TOTAL_OUTDATED=$((NPM_OUTDATED_COUNT + PIP_OUTDATED_COUNT))
    
    log_info "Found $TOTAL_OUTDATED outdated dependencies ($NPM_OUTDATED_COUNT frontend, $PIP_OUTDATED_COUNT backend)."
    
    return 0
}

# Function to check frontend for common security issues
check_frontend_security() {
    log_info "Checking frontend for security issues..."
    
    # Create temporary file to store results
    FRONTEND_ISSUES_FILE=$(mktemp)
    
    # Check for common frontend security issues
    {
        # Check for innerHTML usage (potential XSS)
        log_info "Checking for innerHTML usage (potential XSS)..."
        grep -r -n -E 'innerHTML\s*=|dangerouslySetInnerHTML' \
            --include="*.{js,ts,jsx,tsx}" \
            --exclude-dir={node_modules,dist,build,coverage,__pycache__,.git} \
            "$ROOT_DIR/frontend" 2>/dev/null
        
        # Check for eval usage
        log_info "Checking for eval usage (potential code injection)..."
        grep -r -n -E '\beval\s*\(' \
            --include="*.{js,ts,jsx,tsx}" \
            --exclude-dir={node_modules,dist,build,coverage,__pycache__,.git} \
            "$ROOT_DIR/frontend" 2>/dev/null
        
        # Check for direct DOM manipulation
        log_info "Checking for direct DOM manipulation..."
        grep -r -n -E 'document\.write|document\.writeln' \
            --include="*.{js,ts,jsx,tsx}" \
            --exclude-dir={node_modules,dist,build,coverage,__pycache__,.git} \
            "$ROOT_DIR/frontend" 2>/dev/null
        
        # Check for insecure event handlers
        log_info "Checking for insecure event handlers..."
        grep -r -n -E 'on[a-z]+\s*=\s*[\'"]javascript:' \
            --include="*.{js,ts,jsx,tsx,html}" \
            --exclude-dir={node_modules,dist,build,coverage,__pycache__,.git} \
            "$ROOT_DIR/frontend" 2>/dev/null
        
        # Check for vulnerable target="_blank" links (old browsers)
        log_info "Checking for vulnerable target=\"_blank\" links..."
        grep -r -n -E 'target\s*=\s*[\'"]_blank[\'"](?!.*rel\s*=\s*[\'"]noopener)' \
            --include="*.{js,ts,jsx,tsx,html}" \
            --exclude-dir={node_modules,dist,build,coverage,__pycache__,.git} \
            "$ROOT_DIR/frontend" 2>/dev/null
        
        # Check for localStorage/sessionStorage sensitive data
        log_info "Checking for localStorage/sessionStorage storing sensitive data..."
        grep -r -n -E 'localStorage\.setItem\s*\(\s*[\'"].*token|localStorage\.setItem\s*\(\s*[\'"].*password|localStorage\.setItem\s*\(\s*[\'"].*secret|sessionStorage\.setItem\s*\(\s*[\'"].*token|sessionStorage\.setItem\s*\(\s*[\'"].*password|sessionStorage\.setItem\s*\(\s*[\'"].*secret' \
            --include="*.{js,ts,jsx,tsx}" \
            --exclude-dir={node_modules,dist,build,coverage,__pycache__,.git} \
            "$ROOT_DIR/frontend" 2>/dev/null
    } > "$FRONTEND_ISSUES_FILE"
    
    # Count findings
    FRONTEND_ISSUES_COUNT=$(wc -l < "$FRONTEND_ISSUES_FILE")
    
    log_info "Found $FRONTEND_ISSUES_COUNT potential frontend security issues."
    
    return 0
}

# Function to check backend for common security issues
check_backend_security() {
    log_info "Checking backend for security issues..."
    
    # Create temporary file to store results
    BACKEND_ISSUES_FILE=$(mktemp)
    
    # Check for common backend security issues
    {
        # Check for SQL injection vulnerabilities
        log_info "Checking for SQL injection vulnerabilities..."
        grep -r -n -E 'execute\s*\(\s*[\'"].*\%|cursor\.execute\s*\(\s*[\'"].*\+|cursor\.executemany\s*\(\s*[\'"].*\+|db\.execute\s*\(\s*[\'"].*\+|raw_connection' \
            --include="*.py" \
            --exclude-dir={myenv,dist,build,__pycache__,.git} \
            "$ROOT_DIR/backend" 2>/dev/null
        
        # Check for shell injection vulnerabilities
        log_info "Checking for shell injection vulnerabilities..."
        grep -r -n -E 'os\.system\s*\(|os\.popen\s*\(|subprocess\.call\s*\(|subprocess\.Popen\s*\(|eval\s*\(|exec\s*\(' \
            --include="*.py" \
            --exclude-dir={myenv,dist,build,__pycache__,.git} \
            "$ROOT_DIR/backend" 2>/dev/null
        
        # Check for unsafe deserialization
        log_info "Checking for unsafe deserialization..."
        grep -r -n -E 'pickle\.loads|yaml\.load\s*\([^,]|marshal\.loads|cPickle\.loads' \
            --include="*.py" \
            --exclude-dir={myenv,dist,build,__pycache__,.git} \
            "$ROOT_DIR/backend" 2>/dev/null
        
        # Check for hardcoded secrets
        log_info "Checking for hardcoded secrets..."
        grep -r -n -E '(SECRET_KEY|API_KEY|PASSWORD|TOKEN)\s*=\s*[\'"][^\'"]+[\'"]' \
            --include="*.py" \
            --exclude-dir={myenv,dist,build,__pycache__,.git} \
            "$ROOT_DIR/backend" 2>/dev/null
        
        # Check for file inclusion vulnerabilities
        log_info "Checking for file inclusion vulnerabilities..."
        grep -r -n -E 'open\s*\(\s*.*\+|__import__\s*\(\s*.*\+|importlib\.import_module\s*\(\s*.*\+' \
            --include="*.py" \
            --exclude-dir={myenv,dist,build,__pycache__,.git} \
            "$ROOT_DIR/backend" 2>/dev/null
        
        # Check for session related issues
        log_info "Checking for session security issues..."
        grep -r -n -E 'PERMANENT_SESSION_LIFETIME|session\.permanent|remember_cookie_duration' \
            --include="*.py" \
            --exclude-dir={myenv,dist,build,__pycache__,.git} \
            "$ROOT_DIR/backend" 2>/dev/null
    } > "$BACKEND_ISSUES_FILE"
    
    # Count findings
    BACKEND_ISSUES_COUNT=$(wc -l < "$BACKEND_ISSUES_FILE")
    
    log_info "Found $BACKEND_ISSUES_COUNT potential backend security issues."
    
    return 0
}

# Function to check for insecure configurations
check_insecure_configs() {
    log_info "Checking for insecure configurations..."
    
    # Create temporary file to store results
    CONFIG_ISSUES_FILE=$(mktemp)
    
    # Check for common configuration issues
    {
        # Check for DEBUG=True in production settings
        log_info "Checking for DEBUG=True in production settings..."
        grep -r -n -E 'DEBUG\s*=\s*True' \
            --include="*.{py,json,yml,yaml,env,cfg}" \
            --exclude-dir={node_modules,myenv,dist,build,__pycache__,coverage,.git} \
            "$ROOT_DIR" 2>/dev/null
        
        # Check for missing CORS configurations
        log_info "Checking for missing CORS configurations..."
        grep -r -n -E "Access-Control-Allow-Origin:\s*\*" \
            --include="*.{py,js,ts,json,yml,yaml,env,cfg}" \
            --exclude-dir={node_modules,myenv,dist,build,__pycache__,coverage,.git} \
            "$ROOT_DIR" 2>/dev/null
        
        # Check for missing content security policy
        log_info "Checking for content security policy..."
        grep -r -n -E "Content-Security-Policy" \
            --include="*.{py,js,ts,html,json,yml,yaml,env,cfg}" \
            --exclude-dir={node_modules,myenv,dist,build,__pycache__,coverage,.git} \
            "$ROOT_DIR" 2>/dev/null
        
        # Check for insecure cookie settings
        log_info "Checking for insecure cookie settings..."
        grep -r -n -E 'secure=False|httpOnly=False|SameSite=None' \
            --include="*.{py,js,ts,json,yml,yaml,env,cfg}" \
            --exclude-dir={node_modules,myenv,dist,build,__pycache__,coverage,.git} \
            "$ROOT_DIR" 2>/dev/null
    } > "$CONFIG_ISSUES_FILE"
    
    # Count findings
    CONFIG_ISSUES_COUNT=$(wc -l < "$CONFIG_ISSUES_FILE")
    
    log_info "Found $CONFIG_ISSUES_COUNT potential configuration issues."
    
    return 0
}

# Generate HTML report
generate_report() {
    log_info "Generating security audit report..."
    
    # Get counts
    SECRETS_COUNT=$([ -f "$SECRETS_FILE" ] && wc -l < "$SECRETS_FILE" || echo "0")
    FRONTEND_ISSUES_COUNT=$([ -f "$FRONTEND_ISSUES_FILE" ] && wc -l < "$FRONTEND_ISSUES_FILE" || echo "0")
    BACKEND_ISSUES_COUNT=$([ -f "$BACKEND_ISSUES_FILE" ] && wc -l < "$BACKEND_ISSUES_FILE" || echo "0")
    CONFIG_ISSUES_COUNT=$([ -f "$CONFIG_ISSUES_FILE" ] && wc -l < "$CONFIG_ISSUES_FILE" || echo "0")
    
    # Calculate total issues
    TOTAL_ISSUES=$((SECRETS_COUNT + FRONTEND_ISSUES_COUNT + BACKEND_ISSUES_COUNT + CONFIG_ISSUES_COUNT + TOTAL_OUTDATED))
    
    # Generate HTML report
    cat > "$REPORT_FILE" << EOL
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe Security Report</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
        h1 { color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        h2 { color: #3498db; margin-top: 20px; }
        .summary { display: flex; justify-content: space-between; background-color: #f5f7fa; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
        .summary div { text-align: center; padding: 0 10px; }
        .summary h3 { margin: 0; }
        .issue-count { font-size: 24px; font-weight: bold; color: #e74c3c; }
        .warning-count { font-size: 24px; font-weight: bold; color: #f39c12; }
        .section { background-color: #fff; padding: 15px; margin-bottom: 15px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .finding { font-family: monospace; background-color: #f8f8f8; padding: 8px; margin: 5px 0; border-radius: 3px; white-space: pre-wrap; word-break: break-word; }
        pre { margin: 0; }
        .tabs { display: flex; margin-bottom: 15px; }
        .tab { padding: 10px 15px; background-color: #eee; cursor: pointer; margin-right: 5px; border-radius: 4px 4px 0 0; }
        .tab.active { background-color: #3498db; color: white; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .severity-critical { border-left: 4px solid #e74c3c; }
        .severity-high { border-left: 4px solid #f39c12; }
        .severity-medium { border-left: 4px solid #3498db; }
        .severity-low { border-left: 4px solid #2ecc71; }
    </style>
</head>
<body>
    <h1>Harmonic Universe Security Audit Report</h1>
    <p>Generated on: $(date)</p>
    
    <div class="summary">
        <div>
            <h3>Total Issues</h3>
            <p class="issue-count">$TOTAL_ISSUES</p>
        </div>
        <div>
            <h3>Exposed Secrets</h3>
            <p class="issue-count">$SECRETS_COUNT</p>
        </div>
        <div>
            <h3>Frontend Issues</h3>
            <p class="issue-count">$FRONTEND_ISSUES_COUNT</p>
        </div>
        <div>
            <h3>Backend Issues</h3>
            <p class="issue-count">$BACKEND_ISSUES_COUNT</p>
        </div>
        <div>
            <h3>Config Issues</h3>
            <p class="issue-count">$CONFIG_ISSUES_COUNT</p>
        </div>
        <div>
            <h3>Outdated Deps</h3>
            <p class="issue-count">$TOTAL_OUTDATED</p>
        </div>
    </div>
    
    <div class="tabs">
        <div class="tab active" onclick="openTab(event, 'secrets')">Exposed Secrets</div>
        <div class="tab" onclick="openTab(event, 'frontend')">Frontend Issues</div>
        <div class="tab" onclick="openTab(event, 'backend')">Backend Issues</div>
        <div class="tab" onclick="openTab(event, 'config')">Config Issues</div>
        <div class="tab" onclick="openTab(event, 'outdated')">Outdated Dependencies</div>
    </div>
    
    <div id="secrets" class="tab-content active">
        <div class="section">
            <h2>Exposed Secrets</h2>
            <p>Potential secrets or sensitive information exposed in the codebase:</p>
            $(if [ "$SECRETS_COUNT" -gt 0 ]; then
                cat "$SECRETS_FILE" | while read -r line; do
                    echo "<div class=\"finding severity-critical\">$line</div>"
                done
            else
                echo "<p>No exposed secrets found.</p>"
            fi)
        </div>
    </div>
    
    <div id="frontend" class="tab-content">
        <div class="section">
            <h2>Frontend Security Issues</h2>
            <p>Potential security issues in frontend code:</p>
            $(if [ "$FRONTEND_ISSUES_COUNT" -gt 0 ]; then
                cat "$FRONTEND_ISSUES_FILE" | while read -r line; do
                    echo "<div class=\"finding severity-high\">$line</div>"
                done
            else
                echo "<p>No frontend security issues found.</p>"
            fi)
        </div>
    </div>
    
    <div id="backend" class="tab-content">
        <div class="section">
            <h2>Backend Security Issues</h2>
            <p>Potential security issues in backend code:</p>
            $(if [ "$BACKEND_ISSUES_COUNT" -gt 0 ]; then
                cat "$BACKEND_ISSUES_FILE" | while read -r line; do
                    echo "<div class=\"finding severity-high\">$line</div>"
                done
            else
                echo "<p>No backend security issues found.</p>"
            fi)
        </div>
    </div>
    
    <div id="config" class="tab-content">
        <div class="section">
            <h2>Configuration Issues</h2>
            <p>Potential security issues in configuration files:</p>
            $(if [ "$CONFIG_ISSUES_COUNT" -gt 0 ]; then
                cat "$CONFIG_ISSUES_FILE" | while read -r line; do
                    echo "<div class=\"finding severity-medium\">$line</div>"
                done
            else
                echo "<p>No configuration security issues found.</p>"
            fi)
        </div>
    </div>
    
    <div id="outdated" class="tab-content">
        <div class="section">
            <h2>Outdated Dependencies</h2>
            <p>Dependencies that need updating:</p>
            <h3>Frontend Dependencies</h3>
            $(if [ "$NPM_OUTDATED_COUNT" -gt 0 ]; then
                if [ -f "$NPM_OUTDATED_FILE" ]; then
                    echo "<pre>"
                    cat "$NPM_OUTDATED_FILE"
                    echo "</pre>"
                fi
            else
                echo "<p>No outdated frontend dependencies found.</p>"
            fi)
            
            <h3>Backend Dependencies</h3>
            $(if [ "$PIP_OUTDATED_COUNT" -gt 0 ]; then
                if [ -f "$PIP_OUTDATED_FILE" ]; then
                    echo "<pre>"
                    cat "$PIP_OUTDATED_FILE"
                    echo "</pre>"
                fi
            else
                echo "<p>No outdated backend dependencies found.</p>"
            fi)
        </div>
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        <ol>
            <li>Review and fix exposed secrets first - this is the most critical issue category.</li>
            <li>Address backend security issues, particularly any SQL injection or command injection vulnerabilities.</li>
            <li>Fix frontend security issues, focusing on XSS vulnerabilities first.</li>
            <li>Update outdated dependencies, prioritizing those with known security vulnerabilities.</li>
            <li>Improve security configurations, especially around CORS and cookie settings.</li>
        </ol>
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
    
    log_success "Security audit report generated at: $REPORT_FILE"
    
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
    
    # Clean up temporary files
    rm -f "$SECRETS_FILE" "$FRONTEND_ISSUES_FILE" "$BACKEND_ISSUES_FILE" "$CONFIG_ISSUES_FILE" "$NPM_OUTDATED_FILE" "$PIP_OUTDATED_FILE"
}

# Main function
main() {
    # Ensure report directory exists
    ensure_report_dir
    
    # Run all security checks
    check_exposed_secrets
    check_outdated_deps
    check_frontend_security
    check_backend_security
    check_insecure_configs
    
    # Generate report
    generate_report
    
    log_success "Security audit completed."
}

# Run main function
main 