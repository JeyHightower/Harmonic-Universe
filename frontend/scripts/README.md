# Scripts Directory

This directory contains utility scripts for the Harmonic Universe frontend project.

## Available Scripts

### check-icon-imports.js

This script checks for direct imports from '@ant-design/icons' and helps maintain the consistent use of our custom icons implementation.

#### Usage

```bash
npm run check-icons
```

#### Purpose

The script helps enforce the use of our custom icon components instead of directly importing from '@ant-design/icons'. This ensures:

1. Consistent icon usage across the application
2. Proper ref forwarding for all icon components
3. No PropTypes warnings related to icon components
4. Better control over which icons are available in the application

#### How it works

The script searches for import statements that directly reference '@ant-design/icons' in JavaScript and JSX files within the src directory. If any such imports are found, it:

1. Lists the files containing direct imports
2. Shows the import statement
3. Suggests a fix using the relative path to our custom icons implementation
4. Exits with a non-zero status code (which will prevent commits when used in the pre-commit hook)

#### Integration with Git Hooks

This script is automatically run as part of the pre-commit hook to prevent committing code with direct imports from '@ant-design/icons'.

### merge_nested_frontend.js

This script resolves the nested frontend directory structure by moving files from `frontend/frontend/src` to `frontend/src`.

#### Usage

```bash
node scripts/merge_nested_frontend.js
```

#### Purpose

The script helps clean up the nested directory structure that was causing confusion and path resolution issues. It:

1. Identifies files in the nested structure
2. Copies them to the correct location in the parent structure
3. Preserves existing files in the parent structure
4. Provides instructions for removing the nested directory after verification

### Other Scripts

- **remove_basemodal.sh**: Script to remove BaseModal references from the codebase
- **backup_basemodal.sh**: Script to backup BaseModal-related files before removal
