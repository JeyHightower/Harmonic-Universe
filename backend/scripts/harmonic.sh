#!/bin/bash

# ======================================
# Harmonic Universe - Master Script
# ======================================
#
# This script provides a unified interface to all Harmonic Universe scripts

# Source core utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/core/core.sh"
source "$SCRIPT_DIR/core/utils.sh"

# Get project root directory
ROOT_DIR=$(get_root_dir)

print_help() {
    log_info "Harmonic Universe Command Center"
    log_info "===============================\n"
    log_info "Usage: ./harmonic.sh <category> <command> [options]"
    log_info ""
    log_info "Categories:"
    log_info "  dev         Development commands (setup, dev server)"
    log_info "  build       Build commands"
    log_info "  deploy      Deployment commands (render, docker)"
    log_info "  db          Database commands"
    log_info "  test        Testing commands"
    log_info "  maintain    Maintenance commands (clean, fix, lint)"
    log_info ""
    log_info "Examples:"
    log_info "  ./harmonic.sh dev setup      # Setup development environment"
    log_info "  ./harmonic.sh dev start      # Start development servers"
    log_info "  ./harmonic.sh build all      # Build everything"
    log_info "  ./harmonic.sh deploy render  # Deploy to Render"
    log_info "  ./harmonic.sh db migrate     # Run database migrations"
    log_info "  ./harmonic.sh test all       # Run all tests"
    log_info "  ./harmonic.sh maintain clean # Clean project artifacts"
    log_info ""
    log_info "For detailed help on a specific category:"
    log_info "  ./harmonic.sh <category> help"
}

# Main function
main() {
    if [[ $# -lt 1 ]]; then
        print_help
        exit 0
    fi

    local category="$1"
    shift

    case "$category" in
        dev|development)
            "$SCRIPT_DIR/development/dev.sh" "$@"
            ;;
        build)
            "$SCRIPT_DIR/development/build.sh" "$@"
            ;;
        deploy|deployment)
            "$SCRIPT_DIR/deployment/deploy.sh" "$@"
            ;;
        db|database)
            "$SCRIPT_DIR/database/db.sh" "$@"
            ;;
        test|testing)
            "$SCRIPT_DIR/testing/test.sh" "$@"
            ;;
        maintain|maintenance)
            # Route to specific maintenance script based on command
            local command="${1:-help}"
            shift || true
            
            case "$command" in
                clean)
                    "$SCRIPT_DIR/maintenance/clean.sh" "$@"
                    ;;
                fix)
                    "$SCRIPT_DIR/maintenance/fix.sh" "$@"
                    ;;
                lint)
                    "$SCRIPT_DIR/maintenance/lint.sh" "$@"
                    ;;
                security|audit)
                    "$SCRIPT_DIR/maintenance/security-audit.sh" "$@"
                    ;;
                error|logger)
                    "$SCRIPT_DIR/maintenance/error-logger.sh" "$@"
                    ;;
                *)
                    log_error "Unknown maintenance command: $command"
                    log_info "Available maintenance commands: clean, fix, lint, security, error"
                    exit 1
                    ;;
            esac
            ;;
        help|--help|-h)
            print_help
            ;;
        *)
            log_error "Unknown category: $category"
            print_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@" 