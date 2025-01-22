#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# Function to check if a command was successful
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 completed successfully${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        return 1
    fi
}

# Function to count files by type
count_files() {
    echo "File counts by type:"
    echo "-------------------"
    echo "Python files: $(find . -name "*.py" | wc -l)"
    echo "JavaScript files: $(find . -name "*.js" | wc -l)"
    echo "TypeScript files: $(find . -name "*.ts" | wc -l)"
    echo "React files: $(find . -name "*.jsx" -o -name "*.tsx" | wc -l)"
    echo "CSS files: $(find . -name "*.css" | wc -l)"
    echo "HTML files: $(find . -name "*.html" | wc -l)"
    echo "Markdown files: $(find . -name "*.md" | wc -l)"
    echo "Test files: $(find . -name "*test*.py" -o -name "*test*.js" -o -name "*test*.ts" | wc -l)"
}

# Function to check Python syntax
check_python_syntax() {
    print_header "Checking Python Syntax"
    find . -name "*.py" -not -path "./venv/*" -not -path "./backend/venv/*" -exec python -m py_compile {} \;
    check_status "Python syntax check"
}

# Function to check JavaScript syntax
check_javascript_syntax() {
    print_header "Checking JavaScript Syntax"
    cd frontend
    npm run lint
    check_status "JavaScript syntax check"
    cd ..
}

# Function to verify imports
verify_imports() {
    print_header "Verifying Imports"

    echo "Checking Python imports..."
    cd backend
    python -c "
import pkg_resources
import importlib.util
import os

def check_imports(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                with open(os.path.join(root, file)) as f:
                    for line in f:
                        if line.strip().startswith('import ') or line.strip().startswith('from '):
                            module = line.split()[1].split('.')[0]
                            try:
                                importlib.util.find_spec(module)
                            except ImportError:
                                print(f'Missing import in {os.path.join(root, file)}: {module}')
check_imports('app')
"
    cd ..

    echo "Checking JavaScript imports..."
    cd frontend
    npm ls
    cd ..
}

# Function to verify documentation
verify_documentation() {
    print_header "Verifying Documentation"

    # Check for required documentation files
    required_docs=(
        "README.md"
        "docs/API.md"
        "docs/SETUP.md"
        "docs/USER_GUIDE.md"
        "docs/CONTRIBUTING.md"
        "docs/ARCHITECTURE.md"
        "docs/testing/README.md"
        "docs/features/CHECKLIST.md"
    )

    for doc in "${required_docs[@]}"; do
        if [ -f "$doc" ]; then
            echo -e "${GREEN}✓ Found $doc${NC}"
        else
            echo -e "${RED}✗ Missing $doc${NC}"
        fi
    done
}

# Function to verify test coverage
verify_test_coverage() {
    print_header "Verifying Test Coverage"

    echo "Backend test coverage..."
    cd backend
    coverage run -m pytest
    coverage report
    cd ..

    echo "Frontend test coverage..."
    cd frontend
    npm run test:coverage
    cd ..
}

# Function to verify directory structure
verify_directory_structure() {
    print_header "Verifying Directory Structure"

    required_dirs=(
        "backend/app"
        "backend/tests"
        "frontend/src"
        "frontend/tests"
        "docs"
        "tests"
    )

    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            echo -e "${GREEN}✓ Found $dir${NC}"
        else
            echo -e "${RED}✗ Missing $dir${NC}"
        fi
    done
}

# Main execution
print_header "Starting Codebase Verification"

# Create verification report directory
mkdir -p verification-report

# Run all verifications
count_files > verification-report/file-counts.txt
check_python_syntax 2> verification-report/python-syntax.log
check_javascript_syntax 2> verification-report/javascript-syntax.log
verify_imports > verification-report/imports.log
verify_documentation > verification-report/documentation.log
verify_test_coverage > verification-report/test-coverage.log
verify_directory_structure > verification-report/directory-structure.log

# Generate summary report
print_header "Generating Summary Report"

cat << EOF > verification-report/summary.txt
Codebase Verification Summary
===========================

$(cat verification-report/file-counts.txt)

Documentation Status
------------------
$(cat verification-report/documentation.log)

Directory Structure
-----------------
$(cat verification-report/directory-structure.log)

Test Coverage
------------
$(cat verification-report/test-coverage.log)

Syntax Issues
------------
Python: $(grep -c "Error" verification-report/python-syntax.log) errors
JavaScript: $(grep -c "error" verification-report/javascript-syntax.log) errors

Import Issues
------------
$(grep "Missing import" verification-report/imports.log | wc -l) missing imports found
EOF

print_header "Verification Complete"
echo "See verification-report directory for detailed reports"
