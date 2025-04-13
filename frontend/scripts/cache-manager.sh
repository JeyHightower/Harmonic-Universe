#!/bin/bash

# =========================================
# Harmonic Universe - Cache Manager
# =========================================
#
# This script manages caching for the Harmonic Universe frontend

# Get script directory path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$ROOT_DIR")"

# Source core utilities
source "$PROJECT_ROOT/scripts/core.sh"
source "$PROJECT_ROOT/scripts/utils.sh"

# Welcome message
print_banner
log_info "Harmonic Universe Cache Manager"

# Constants
CACHE_DIR="$ROOT_DIR/.cache"
SERVICE_WORKER_DIR="$ROOT_DIR/public"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="$ROOT_DIR/.cache-backups"

# Ensure cache directory exists
ensure_cache_dir() {
    if [ ! -d "$CACHE_DIR" ]; then
        log_info "Creating cache directory at $CACHE_DIR"
        mkdir -p "$CACHE_DIR"
    fi
    
    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "Creating cache backup directory at $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# Function to generate a service worker for caching
generate_service_worker() {
    log_info "Generating service worker for caching..."
    
    # Get list of static assets
    if [ ! -d "$ROOT_DIR/dist" ]; then
        log_warning "No dist directory found. Building project first..."
        cd "$ROOT_DIR"
        
        # Determine package manager
        PM=$(get_package_manager ".")
        
        # Build the project
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
    
    # Check if build was successful
    if [ ! -d "$ROOT_DIR/dist" ]; then
        log_error "Build failed. Cannot generate service worker."
        return 1
    fi
    
    # Create service worker directory if it doesn't exist
    if [ ! -d "$SERVICE_WORKER_DIR" ]; then
        mkdir -p "$SERVICE_WORKER_DIR"
    fi
    
    # Create cache version
    CACHE_VERSION=$(date +%Y%m%d%H%M%S)
    
    # Create list of static assets to cache
    ASSETS=$(find "$ROOT_DIR/dist" -type f | sed "s|$ROOT_DIR/dist/||" | sort)
    
    # Generate service worker file
    cat > "$SERVICE_WORKER_DIR/service-worker.js" << EOL
// Service Worker for Harmonic Universe
// Generated on $(date)

const CACHE_NAME = 'harmonic-universe-cache-v$CACHE_VERSION';
const ASSETS = [
    '/',
    '/index.html',
$(echo "$ASSETS" | sed "s|^|    '/|" | sed "s|$|',|")
];

// Install event - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching assets...');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request)
                    .then(response => {
                        // Don't cache non-GET requests or if response is not valid
                        if (event.request.method !== 'GET' || !response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response
                        const responseToCache = response.clone();
                        
                        // Cache the fetched resource
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                            
                        return response;
                    });
            })
            .catch(() => {
                // Fallback for offline pages
                if (event.request.url.indexOf('.html') > -1) {
                    return caches.match('/index.html');
                }
            })
    );
});
EOL
    
    # Create a registration script
    cat > "$SERVICE_WORKER_DIR/register-sw.js" << EOL
// Service Worker Registration for Harmonic Universe

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope:', registration.scope);
            })
            .catch(error => {
                console.error('ServiceWorker registration failed:', error);
            });
    });
}
EOL
    
    log_success "Service worker generated."
    log_info "Add the following script tag to your HTML to enable caching:"
    log_info "<script src=\"/register-sw.js\"></script>"
}

# Function to clear caches
clear_cache() {
    log_info "Clearing caches..."
    
    # Clear package manager cache if specified
    if [ "$1" = "all" ] || [ "$1" = "npm" ]; then
        log_info "Clearing package manager cache..."
        
        # Determine package manager
        PM=$(get_package_manager "$ROOT_DIR")
        
        cd "$ROOT_DIR"
        
        case "$PM" in
            pnpm)
                pnpm store prune
                ;;
            yarn)
                yarn cache clean
                ;;
            npm)
                npm cache clean --force
                ;;
        esac
    fi
    
    # Clear build cache if specified
    if [ "$1" = "all" ] || [ "$1" = "build" ]; then
        log_info "Clearing build cache..."
        
        # Backup dist directory if it exists
        if [ -d "$ROOT_DIR/dist" ]; then
            log_info "Backing up dist directory..."
            mkdir -p "$BACKUP_DIR/dist-$TIMESTAMP"
            cp -R "$ROOT_DIR/dist" "$BACKUP_DIR/dist-$TIMESTAMP"
            
            # Remove dist directory
            rm -rf "$ROOT_DIR/dist"
        fi
        
        # Remove other cache directories
        rm -rf "$ROOT_DIR/.vite"
        rm -rf "$ROOT_DIR/node_modules/.vite"
        rm -rf "$ROOT_DIR/node_modules/.cache"
    fi
    
    # Clear browser cache if specified (generate new service worker)
    if [ "$1" = "all" ] || [ "$1" = "browser" ]; then
        log_info "Updating service worker for browser cache invalidation..."
        generate_service_worker
    fi
    
    log_success "Cache clearing completed."
}

# Function to analyze cache
analyze_cache() {
    log_info "Analyzing cache usage..."
    
    # Create report file
    REPORT_FILE="$CACHE_DIR/cache-report-$TIMESTAMP.txt"
    
    # Write report header
    cat > "$REPORT_FILE" << EOL
Harmonic Universe Cache Analysis Report
Generated on: $(date)

EOL
    
    # Analyze node_modules size
    if [ -d "$ROOT_DIR/node_modules" ]; then
        echo "Node Modules Analysis:" >> "$REPORT_FILE"
        echo "---------------------" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        
        # Get total size
        NODE_MODULES_SIZE=$(du -sh "$ROOT_DIR/node_modules" | cut -f1)
        echo "Total size: $NODE_MODULES_SIZE" >> "$REPORT_FILE"
        
        # Get largest packages
        echo "" >> "$REPORT_FILE"
        echo "Top 20 largest packages:" >> "$REPORT_FILE"
        find "$ROOT_DIR/node_modules" -maxdepth 1 -type d | grep -v "^$ROOT_DIR/node_modules$" | xargs du -sh 2>/dev/null | sort -hr | head -20 >> "$REPORT_FILE"
        
        echo "" >> "$REPORT_FILE"
    fi
    
    # Analyze dist directory
    if [ -d "$ROOT_DIR/dist" ]; then
        echo "Build Output Analysis:" >> "$REPORT_FILE"
        echo "---------------------" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        
        # Get total size
        DIST_SIZE=$(du -sh "$ROOT_DIR/dist" | cut -f1)
        echo "Total size: $DIST_SIZE" >> "$REPORT_FILE"
        
        # Analyze by file type
        echo "" >> "$REPORT_FILE"
        echo "Size by file type:" >> "$REPORT_FILE"
        find "$ROOT_DIR/dist" -type f | grep -v "^\." | sed 's/.*\.//' | sort | uniq -c | while read -r count ext; do
            size=$(find "$ROOT_DIR/dist" -name "*.$ext" -type f -print0 | xargs -0 du -ch | tail -1 | cut -f1)
            echo "$ext: $size ($count files)" >> "$REPORT_FILE"
        done
        
        echo "" >> "$REPORT_FILE"
        
        # Largest files
        echo "Top 20 largest files:" >> "$REPORT_FILE"
        find "$ROOT_DIR/dist" -type f -print0 | xargs -0 du -h | sort -hr | head -20 >> "$REPORT_FILE"
        
        echo "" >> "$REPORT_FILE"
    fi
    
    # Analyze other cache directories
    if [ -d "$ROOT_DIR/.cache" ]; then
        echo "Cache Directory Analysis:" >> "$REPORT_FILE"
        echo "------------------------" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        
        # Get total size
        CACHE_SIZE=$(du -sh "$ROOT_DIR/.cache" | cut -f1)
        echo "Total size: $CACHE_SIZE" >> "$REPORT_FILE"
        
        echo "" >> "$REPORT_FILE"
    fi
    
    log_success "Cache analysis completed. Report saved to: $REPORT_FILE"
    
    # Display report
    cat "$REPORT_FILE"
}

# Function to optimize caching
optimize_cache() {
    log_info "Optimizing caching strategies..."
    
    # Create cache manifest for the application
    log_info "Creating cache manifest..."
    
    # Ensure dist directory exists
    if [ ! -d "$ROOT_DIR/dist" ]; then
        log_warning "No dist directory found. Building project first..."
        cd "$ROOT_DIR"
        
        # Determine package manager
        PM=$(get_package_manager ".")
        
        # Build the project
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
    
    # Create public directory if it doesn't exist
    if [ ! -d "$SERVICE_WORKER_DIR" ]; then
        mkdir -p "$SERVICE_WORKER_DIR"
    fi
    
    # Create cache manifest
    cat > "$SERVICE_WORKER_DIR/manifest.webmanifest" << EOL
{
    "name": "Harmonic Universe",
    "short_name": "Harmonic",
    "description": "Harmonic Universe Application",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#3498db",
    "icons": [
        {
            "src": "/icons/icon-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "/icons/icon-512x512.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ],
    "cache": {
        "version": "$TIMESTAMP",
        "strategy": "networkFirst",
        "assets": [
$(find "$ROOT_DIR/dist" -type f | sed "s|$ROOT_DIR/dist/||" | sort | sed 's/^/            "/' | sed 's/$/",/')
        ]
    }
}
EOL
    
    # Generate service worker
    generate_service_worker
    
    # Update HTML to include cache manifest reference
    log_info "Updating HTML to include cache manifest reference..."
    
    if [ -f "$ROOT_DIR/dist/index.html" ]; then
        # Backup original file
        cp "$ROOT_DIR/dist/index.html" "$ROOT_DIR/dist/index.html.bak"
        
        # Add manifest link
        sed -i.tmp '/<\/head>/i \    <link rel="manifest" href="/manifest.webmanifest">' "$ROOT_DIR/dist/index.html"
        sed -i.tmp '/<\/body>/i \    <script src="/register-sw.js"></script>' "$ROOT_DIR/dist/index.html"
        
        # Remove temporary file
        rm -f "$ROOT_DIR/dist/index.html.tmp"
        
        log_success "HTML updated with cache manifest reference."
    else
        log_warning "No index.html found in dist directory."
    fi
    
    log_success "Cache optimization completed."
}

# Main function
main() {
    # Ensure cache directory exists
    ensure_cache_dir
    
    if [ $# -eq 0 ]; then
        # Show help if no arguments provided
        log_info "Usage: $0 [generate|clear TYPE|analyze|optimize]"
        log_info "  generate  - Generate service worker for caching"
        log_info "  clear     - Clear caches (TYPE: all, npm, build, browser)"
        log_info "  analyze   - Analyze cache usage"
        log_info "  optimize  - Optimize caching strategies"
        exit 0
    fi
    
    # Process arguments
    case "$1" in
        generate)
            generate_service_worker
            ;;
        clear)
            clear_cache "${2:-all}"
            ;;
        analyze)
            analyze_cache
            ;;
        optimize)
            optimize_cache
            ;;
        *)
            log_error "Unknown command: $1"
            log_info "Usage: $0 [generate|clear TYPE|analyze|optimize]"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 