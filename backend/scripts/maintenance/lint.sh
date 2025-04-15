#!/bin/bash
# lint.sh - Linting script for the Harmonic Universe application
# This script runs linters on the codebase to ensure code quality

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Print with color
print_green() {
    echo -e "\e[32m$1\e[0m"
}

print_yellow() {
    echo -e "\e[33m$1\e[0m"
}

print_red() {
    echo -e "\e[31m$1\e[0m"
}

# Check if required tools are installed
check_prerequisites() {
    print_yellow "Checking prerequisites..."
    
    # Check for Python linters
    if ! command -v flake8 &> /dev/null; then
        print_yellow "flake8 is not installed. Installing..."
        pip install flake8
    fi
    
    if ! command -v black &> /dev/null; then
        print_yellow "black is not installed. Installing..."
        pip install black
    fi
    
    # Check for Node/JavaScript linters
    if [ -d "$FRONTEND_DIR" ]; then
        cd "$FRONTEND_DIR"
        
        # Check for ESLint in package.json
        if grep -q "\"eslint\"" package.json; then
            print_green "ESLint is configured in package.json."
        else
            print_yellow "ESLint is not configured in package.json. Adding it..."
            npm install --save-dev eslint
        fi
        
        # Check for Prettier in package.json
        if grep -q "\"prettier\"" package.json; then
            print_green "Prettier is configured in package.json."
        else
            print_yellow "Prettier is not configured in package.json. Adding it..."
            npm install --save-dev prettier
        fi
    fi
    
    print_green "All prerequisites checked."
}

# Set up linting configuration if not present
setup_linting_configs() {
    print_yellow "Setting up linting configurations if needed..."
    
    # Set up Python linting configs
    if [ -d "$BACKEND_DIR" ]; then
        # Setup flake8 config if not present
        if [ ! -f "$BACKEND_DIR/.flake8" ]; then
            cat > "$BACKEND_DIR/.flake8" << EOF
[flake8]
max-line-length = 100
exclude = .git,__pycache__,myenv,migrations,tests,docs
ignore = E203, W503
EOF
            print_green "Created flake8 configuration at $BACKEND_DIR/.flake8"
        fi
        
        # Setup black config if not present
        if [ ! -f "$BACKEND_DIR/pyproject.toml" ]; then
            cat > "$BACKEND_DIR/pyproject.toml" << EOF
[tool.black]
line-length = 100
target-version = ['py38']
include = '\.pyi?$'
exclude = '''
/(
    \.git
  | \.hg
  | \.mypy_cache
  | \.tox
  | \.myenv
  | myenv
  | _build
  | buck-out
  | build
  | dist
  | migrations
)/
'''
EOF
            print_green "Created black configuration at $BACKEND_DIR/pyproject.toml"
        fi
    fi
    
    # Set up JavaScript linting configs
    if [ -d "$FRONTEND_DIR" ]; then
        # Setup ESLint config if not present
        if [ ! -f "$FRONTEND_DIR/.eslintrc.json" ]; then
            cat > "$FRONTEND_DIR/.eslintrc.json" << EOF
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true,
    "jest": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  "parserOptions": {
    "ecmaVersion": 12,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": [
    "react",
    "react-hooks",
    "jsx-a11y"
  ],
  "settings": {
    "react": {
      "version": "detect"
    }
  },
  "rules": {
    "indent": ["error", 2],
    "linebreak-style": ["error", "unix"],
    "quotes": ["error", "single"],
    "semi": ["error", "always"],
    "no-unused-vars": ["warn"],
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "react/prop-types": "warn",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
EOF
            print_green "Created ESLint configuration at $FRONTEND_DIR/.eslintrc.json"
            
            # Install required ESLint plugins for React
            print_yellow "Installing ESLint plugins for React..."
            npm install --save-dev eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y
            print_green "ESLint plugins installed."
        fi
        
        # Setup Prettier config if not present
        if [ ! -f "$FRONTEND_DIR/.prettierrc" ]; then
            cat > "$FRONTEND_DIR/.prettierrc" << EOF
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100,
  "trailingComma": "es5",
  "jsxSingleQuote": false,
  "jsxBracketSameLine": false
}
EOF
            print_green "Created Prettier configuration at $FRONTEND_DIR/.prettierrc"
        fi
    fi
    
    print_green "Linting configurations setup complete."
}

# Lint Python code
lint_python() {
    print_yellow "Linting Python code..."
    
    if [ ! -d "$BACKEND_DIR" ]; then
        print_yellow "Backend directory not found. Skipping Python linting."
        return
    fi
    
    cd "$BACKEND_DIR"
    
    # Activate virtual environment if it exists
    if [ -d "myenv" ]; then
        source myenv/bin/activate
    fi
    
    # Run flake8
    print_yellow "Running flake8..."
    if flake8 . --count --exit-zero --statistics; then
        print_green "flake8 check passed."
    else
        print_red "flake8 found issues. See above for details."
    fi
    
    # Run black in check mode
    print_yellow "Running black in check mode..."
    if black --check . 2>/dev/null; then
        print_green "black check passed."
    else
        print_red "black found formatting issues."
        read -p "Would you like to fix these issues automatically? (y/n): " fix_black
        if [[ "$fix_black" == [yY] ]]; then
            print_yellow "Fixing Python formatting issues with black..."
            black .
            print_green "Python formatting issues fixed."
        fi
    fi
    
    # Deactivate virtual environment if activated
    if [ -d "myenv" ]; then
        deactivate
    fi
}

# Lint JavaScript/TypeScript code
lint_javascript() {
    print_yellow "Linting JavaScript/TypeScript code..."
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        print_yellow "Frontend directory not found. Skipping JavaScript linting."
        return
    fi
    
    cd "$FRONTEND_DIR"
    
    # Run ESLint
    print_yellow "Running ESLint..."
    if [ -f "node_modules/.bin/eslint" ]; then
        if npx eslint . --ext .js,.jsx,.ts,.tsx --max-warnings=0; then
            print_green "ESLint check passed."
        else
            print_red "ESLint found issues. See above for details."
            read -p "Would you like to fix these issues automatically? (y/n): " fix_eslint
            if [[ "$fix_eslint" == [yY] ]]; then
                print_yellow "Fixing JavaScript linting issues with ESLint..."
                npx eslint . --ext .js,.jsx,.ts,.tsx --fix
                print_green "JavaScript linting issues fixed."
            fi
        fi
    else
        print_yellow "ESLint not found in node_modules. Skipping ESLint check."
    fi
    
    # Run Prettier in check mode
    print_yellow "Running Prettier in check mode..."
    if [ -f "node_modules/.bin/prettier" ]; then
        if npx prettier --check "src/**/*.{js,jsx,ts,tsx,json,css,scss,md}"; then
            print_green "Prettier check passed."
        else
            print_red "Prettier found formatting issues."
            read -p "Would you like to fix these issues automatically? (y/n): " fix_prettier
            if [[ "$fix_prettier" == [yY] ]]; then
                print_yellow "Fixing JavaScript formatting issues with Prettier..."
                npx prettier --write "src/**/*.{js,jsx,ts,tsx,json,css,scss,md}"
                print_green "JavaScript formatting issues fixed."
            fi
        fi
    else
        print_yellow "Prettier not found in node_modules. Skipping Prettier check."
    fi
}

# Check for unused dependencies
check_unused_dependencies() {
    print_yellow "Checking for unused dependencies..."
    
    if [ -d "$FRONTEND_DIR" ]; then
        cd "$FRONTEND_DIR"
        
        # Check if depcheck is installed
        if ! npx depcheck --version &> /dev/null; then
            print_yellow "depcheck is not installed. Installing..."
            npm install --save-dev depcheck
        fi
        
        print_yellow "Running depcheck for frontend..."
        npx depcheck
        print_green "Frontend dependency check complete."
    fi
    
    if [ -d "$BACKEND_DIR" ]; then
        cd "$BACKEND_DIR"
        
        # Activate virtual environment if it exists
        if [ -d "myenv" ]; then
            source myenv/bin/activate
        fi
        
        # Check if pipreqs is installed
        if ! command -v pipreqs &> /dev/null; then
            print_yellow "pipreqs is not installed. Installing..."
            pip install pipreqs
        fi
        
        print_yellow "Running pipreqs for backend..."
        pipreqs --mode compat --force .
        print_green "Generated requirements.txt with only used packages."
        
        # Deactivate virtual environment if activated
        if [ -d "myenv" ]; then
            deactivate
        fi
    fi
    
    print_green "Dependency check complete."
}

# Find and fix security issues
check_security() {
    print_yellow "Checking for security issues..."
    
    if [ -d "$BACKEND_DIR" ]; then
        cd "$BACKEND_DIR"
        
        # Activate virtual environment if it exists
        if [ -d "myenv" ]; then
            source myenv/bin/activate
        fi
        
        # Check if bandit is installed
        if ! command -v bandit &> /dev/null; then
            print_yellow "bandit is not installed. Installing..."
            pip install bandit
        fi
        
        print_yellow "Running bandit for Python security checks..."
        bandit -r . -x myenv,tests
        
        # Deactivate virtual environment if activated
        if [ -d "myenv" ]; then
            deactivate
        fi
    fi
    
    if [ -d "$FRONTEND_DIR" ]; then
        cd "$FRONTEND_DIR"
        
        print_yellow "Running npm audit for JavaScript security checks..."
        npm audit
    fi
    
    print_green "Security check complete."
}

# Show help message
show_help() {
    echo "Harmonic Universe Lint Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --python      - Only lint Python code"
    echo "  --javascript  - Only lint JavaScript/TypeScript code"
    echo "  --fix         - Automatically fix lint issues"
    echo "  --deps        - Check for unused dependencies"
    echo "  --security    - Check for security issues"
    echo "  --all         - Run all linting checks"
    echo "  --help        - Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 --all      # Run all linting checks"
    echo "  $0 --python   # Only lint Python code"
}

# Main function
main() {
    print_green "==== Linting Harmonic Universe Codebase ===="
    
    # If no arguments, show help
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    # Process arguments
    local lint_python_flag=false
    local lint_javascript_flag=false
    local fix_flag=false
    local check_deps_flag=false
    local security_flag=false
    local all_flag=false
    
    while [[ "$#" -gt 0 ]]; do
        case $1 in
            --python)
                lint_python_flag=true
                ;;
            --javascript)
                lint_javascript_flag=true
                ;;
            --fix)
                fix_flag=true
                ;;
            --deps)
                check_deps_flag=true
                ;;
            --security)
                security_flag=true
                ;;
            --all)
                all_flag=true
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                print_red "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
        shift
    done
    
    # If --all flag is set, set all flags to true
    if [ "$all_flag" = true ]; then
        lint_python_flag=true
        lint_javascript_flag=true
        check_deps_flag=true
        security_flag=true
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Setup linting configurations
    setup_linting_configs
    
    # Run linters based on flags
    if [ "$lint_python_flag" = true ]; then
        lint_python
    fi
    
    if [ "$lint_javascript_flag" = true ]; then
        lint_javascript
    fi
    
    if [ "$check_deps_flag" = true ]; then
        check_unused_dependencies
    fi
    
    if [ "$security_flag" = true ]; then
        check_security
    fi
    
    print_green "==== Linting Completed Successfully ===="
}

# Run main function with all arguments passed to the script
main "$@" 