#!/bin/bash

# =========================================
# Harmonic Universe - Performance Monitoring
# =========================================
#
# This script helps monitor and optimize frontend performance

# Get script directory path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$ROOT_DIR")"

# Source core utilities
source "$PROJECT_ROOT/scripts/core.sh"
source "$PROJECT_ROOT/scripts/utils.sh"

# Welcome message
print_banner
log_info "Harmonic Universe Performance Monitoring"

# Function to analyze bundle size
analyze_bundle() {
    log_info "Analyzing bundle size..."
    
    # Change to frontend directory
    cd "$ROOT_DIR"
    
    # Determine package manager
    PM=$(get_package_manager ".")
    
    # Install bundle analyzer if not present
    if ! grep -q "rollup-plugin-visualizer" package.json; then
        log_info "Installing rollup-plugin-visualizer for bundle analysis..."
        case "$PM" in
            pnpm)
                pnpm add -D rollup-plugin-visualizer
                ;;
            yarn)
                yarn add -D rollup-plugin-visualizer
                ;;
            npm)
                npm install --save-dev rollup-plugin-visualizer
                ;;
        esac
    fi
    
    # Temporarily modify vite.config.js to add visualizer
    if [ -f "vite.config.js" ]; then
        # Create backup
        cp vite.config.js vite.config.js.bak
        
        # Add visualizer to config
        cat > .temp-visualizer-config.js << EOL
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

// Import original config
import originalConfig from './vite.config.js';

// Merge configs
export default defineConfig({
  ...originalConfig,
  plugins: [
    ...(originalConfig.plugins || []),
    visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
EOL

        log_info "Building project with bundle analyzer..."
        case "$PM" in
            pnpm)
                VITE_CONFIG_PATH=.temp-visualizer-config.js pnpm run build
                ;;
            yarn)
                VITE_CONFIG_PATH=.temp-visualizer-config.js yarn build
                ;;
            npm)
                VITE_CONFIG_PATH=.temp-visualizer-config.js npm run build
                ;;
        esac
        
        # Restore original config
        mv vite.config.js.bak vite.config.js
        rm -f .temp-visualizer-config.js
        
        log_success "Bundle analysis complete. Check dist/stats.html for visualization."
    else
        log_error "vite.config.js not found. Cannot analyze bundle."
    fi
}

# Function to run Lighthouse audit
run_lighthouse() {
    log_info "Preparing to run Lighthouse audit..."
    
    # Check if Lighthouse is installed
    if ! command -v lighthouse &> /dev/null; then
        log_warning "Lighthouse CLI not found. Installing globally..."
        npm install -g lighthouse
    fi
    
    # Check if project is built
    if [ ! -d "$ROOT_DIR/dist" ]; then
        log_warning "dist directory not found. Building project first..."
        cd "$ROOT_DIR"
        
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
    
    # Serve the build directory
    log_info "Starting a local server to serve the build..."
    npx serve -s "$ROOT_DIR/dist" &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 3
    
    # Run Lighthouse
    log_info "Running Lighthouse audit..."
    mkdir -p "$ROOT_DIR/performance-reports"
    REPORT_PATH="$ROOT_DIR/performance-reports/lighthouse-$(date +%Y%m%d-%H%M%S).html"
    lighthouse http://localhost:3000 --quiet --chrome-flags="--headless" --output=html --output-path="$REPORT_PATH"
    
    # Kill the server
    kill $SERVER_PID
    
    log_success "Lighthouse audit complete. Report saved to: $REPORT_PATH"
}

# Main function
main() {
    if [ $# -eq 0 ]; then
        # Show help if no arguments provided
        log_info "Usage: $0 [analyze-bundle|lighthouse]"
        exit 0
    fi
    
    # Process arguments
    case "$1" in
        analyze-bundle)
            analyze_bundle
            ;;
        lighthouse)
            run_lighthouse
            ;;
        *)
            log_error "Unknown command: $1"
            log_info "Usage: $0 [analyze-bundle|lighthouse]"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 