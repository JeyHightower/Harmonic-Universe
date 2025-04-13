#!/bin/bash

# =========================================
# Harmonic Universe - Accessibility Testing
# =========================================
#
# This script runs accessibility tests on the frontend

# Get script directory path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$ROOT_DIR")"

# Source core utilities
source "$PROJECT_ROOT/scripts/core.sh"
source "$PROJECT_ROOT/scripts/utils.sh"

# Welcome message
print_banner
log_info "Harmonic Universe Accessibility Testing"

# Function to run pa11y accessibility tests
run_pa11y() {
    log_info "Running accessibility tests with pa11y..."
    
    # Change to frontend directory
    cd "$ROOT_DIR"
    
    # Check if project is built
    if [ ! -d "dist" ]; then
        log_warning "dist directory not found. Building project first..."
        
        # Determine package manager
        PM=$(get_package_manager ".")
        
        case "$PM" in
            pnpm)
                pnpm run build
                ;;
            yarn)
                yarn build
                ;;
            npm)
                npm run build
                ;;
        esac
    fi
    
    # Check if pa11y is installed
    if ! command -v pa11y &> /dev/null; then
        log_warning "pa11y not found. Installing globally..."
        npm install -g pa11y pa11y-ci
    fi
    
    # Create reports directory
    mkdir -p "accessibility-reports"
    
    # Serve the build directory
    log_info "Starting a local server to serve the build..."
    npx serve -s dist &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 3
    
    # Run pa11y tests
    log_info "Running pa11y accessibility audit..."
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    pa11y http://localhost:3000 --reporter html > "accessibility-reports/pa11y-report-$TIMESTAMP.html"
    
    # Kill the server
    kill $SERVER_PID
    
    log_success "Accessibility test complete. Report saved to: accessibility-reports/pa11y-report-$TIMESTAMP.html"
}

# Function to run axe-core accessibility checks
run_axe() {
    log_info "Running accessibility checks with axe-core..."
    
    # Change to frontend directory
    cd "$ROOT_DIR"
    
    # Create test file that uses axe-core
    mkdir -p "accessibility-tests"
    
    cat > "accessibility-tests/axe-test.js" << EOL
const { AxePuppeteer } = require('@axe-core/puppeteer');
const puppeteer = require('puppeteer');

async function runAxe() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Navigate to the local server
  await page.goto('http://localhost:3000');
  
  // Run axe on the page
  const results = await new AxePuppeteer(page).analyze();
  
  // Output results
  console.log(JSON.stringify(results, null, 2));
  
  await browser.close();
}

runAxe().catch(err => {
  console.error('Error running axe tests:', err);
  process.exit(1);
});
EOL
    
    # Install necessary dependencies
    PM=$(get_package_manager ".")
    log_info "Installing axe-core dependencies..."
    
    case "$PM" in
        pnpm)
            pnpm add -D puppeteer @axe-core/puppeteer
            ;;
        yarn)
            yarn add -D puppeteer @axe-core/puppeteer
            ;;
        npm)
            npm install --save-dev puppeteer @axe-core/puppeteer
            ;;
    esac
    
    # Serve the build directory
    log_info "Starting a local server to serve the build..."
    npx serve -s dist &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 3
    
    # Run axe tests
    log_info "Running axe accessibility audit..."
    mkdir -p "accessibility-reports"
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    node "accessibility-tests/axe-test.js" > "accessibility-reports/axe-report-$TIMESTAMP.json"
    
    # Kill the server
    kill $SERVER_PID
    
    log_success "Axe accessibility test complete. Report saved to: accessibility-reports/axe-report-$TIMESTAMP.json"
    
    # Create a human-readable HTML report from the JSON
    log_info "Converting JSON report to HTML..."
    
    cat > "accessibility-reports/axe-report-$TIMESTAMP.html" << EOL
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Axe Accessibility Report</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
        h1 { color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        h2 { color: #3498db; margin-top: 20px; }
        .violation { background-color: #ffecec; border-left: 4px solid #e74c3c; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
        .impact-critical { border-left-color: #e74c3c; }
        .impact-serious { border-left-color: #f39c12; }
        .impact-moderate { border-left-color: #3498db; }
        .impact-minor { border-left-color: #2ecc71; }
        .violation h3 { margin-top: 0; }
        .nodes { margin-left: 20px; }
        .node { background-color: #f9f9f9; padding: 10px; margin-bottom: 10px; border-radius: 4px; }
        pre { background-color: #f5f5f5; padding: 10px; overflow: auto; border-radius: 4px; }
        .summary { display: flex; justify-content: space-between; background-color: #f5f7fa; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
        .summary div { text-align: center; }
        .summary h3 { margin: 0; }
        .critical { color: #e74c3c; }
        .serious { color: #f39c12; }
        .moderate { color: #3498db; }
        .minor { color: #2ecc71; }
    </style>
</head>
<body>
    <h1>Axe Accessibility Report</h1>
    <div id="summary" class="summary">Loading...</div>
    <div id="violations">Loading...</div>
    <h2>Passes</h2>
    <div id="passes">Loading...</div>
    
    <script>
        // Fetch and parse the JSON data
        fetch('axe-report-$TIMESTAMP.json')
            .then(response => response.json())
            .then(data => {
                // Populate summary
                const summary = document.getElementById('summary');
                summary.innerHTML = \`
                    <div>
                        <h3>Total Violations</h3>
                        <p class="critical">\${data.violations.length}</p>
                    </div>
                    <div>
                        <h3>Critical</h3>
                        <p class="critical">\${data.violations.filter(v => v.impact === 'critical').length}</p>
                    </div>
                    <div>
                        <h3>Serious</h3>
                        <p class="serious">\${data.violations.filter(v => v.impact === 'serious').length}</p>
                    </div>
                    <div>
                        <h3>Moderate</h3>
                        <p class="moderate">\${data.violations.filter(v => v.impact === 'moderate').length}</p>
                    </div>
                    <div>
                        <h3>Minor</h3>
                        <p class="minor">\${data.violations.filter(v => v.impact === 'minor').length}</p>
                    </div>
                \`;
                
                // Populate violations
                const violations = document.getElementById('violations');
                violations.innerHTML = data.violations.map(violation => \`
                    <div class="violation impact-\${violation.impact || 'moderate'}">
                        <h3>\${violation.id}: \${violation.help}</h3>
                        <p><strong>Impact:</strong> \${violation.impact || 'Not specified'}</p>
                        <p><strong>Description:</strong> \${violation.description}</p>
                        <p><strong>Help:</strong> <a href="\${violation.helpUrl}" target="_blank">\${violation.helpUrl}</a></p>
                        <div class="nodes">
                            <h4>Affected Elements:</h4>
                            \${violation.nodes.map(node => \`
                                <div class="node">
                                    <p><strong>HTML:</strong></p>
                                    <pre>\${node.html}</pre>
                                    <p><strong>Failure Summary:</strong> \${node.failureSummary}</p>
                                </div>
                            \`).join('')}
                        </div>
                    </div>
                \`).join('');
                
                // Populate passes
                const passes = document.getElementById('passes');
                passes.innerHTML = \`<p>Passed \${data.passes.length} checks</p>\`;
            })
            .catch(error => {
                console.error('Error loading report:', error);
                document.getElementById('summary').innerHTML = '<p>Error loading report data</p>';
                document.getElementById('violations').innerHTML = '<p>Error loading report data</p>';
                document.getElementById('passes').innerHTML = '<p>Error loading report data</p>';
            });
    </script>
</body>
</html>
EOL
    
    log_success "HTML report generated: accessibility-reports/axe-report-$TIMESTAMP.html"
}

# Main function
main() {
    if [ $# -eq 0 ]; then
        # Show help if no arguments provided
        log_info "Usage: $0 [pa11y|axe]"
        exit 0
    fi
    
    # Process arguments
    case "$1" in
        pa11y)
            run_pa11y
            ;;
        axe)
            run_axe
            ;;
        *)
            log_error "Unknown command: $1"
            log_info "Usage: $0 [pa11y|axe]"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 