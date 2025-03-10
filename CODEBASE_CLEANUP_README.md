# Harmonic Universe Codebase Cleanup

This set of scripts is designed to perform a thorough cleanup of the Harmonic Universe codebase, establishing a single source of truth by eliminating duplicate files, consolidating similar code, and resolving conflicts.

## Scripts Overview

### 1. `master_cleanup.sh`

The main script that orchestrates the entire cleanup process. It runs all the other scripts in sequence, repeating the process 15 times to ensure thoroughness.

### 2. `find_conflicts.sh`

Identifies conflicts and duplicate code throughout the codebase:

- Finds exact file duplicates using MD5 hashes
- Detects similar JavaScript files
- Checks for conflicting Python imports
- Identifies conflicting route definitions
- Finds conflicting static file references

### 3. `cleanup_codebase.sh`

Performs the actual cleanup of the codebase:

- Consolidates duplicate shell scripts
- Creates a clean directory structure for scripts
- Organizes static files into a single source of truth
- Consolidates React fix files
- Updates references in Python code to use the correct static paths

### 4. `verify_cleanup.sh`

Verifies that the cleanup was successful:

- Checks that all required directories and files exist
- Ensures essential scripts are present
- Verifies that symlinks are valid
- Checks for remaining duplicate files
- Confirms that static paths in Flask are correct

## How to Use

1. **Run the master script** to perform the entire cleanup process:

   ```
   ./master_cleanup.sh
   ```

   This will run all 3 scripts in sequence, 15 times, with a detailed log stored in a timestamped file.

2. **Run individual scripts** if you want to perform specific operations:

   ```
   ./find_conflicts.sh     # Find conflicts without making changes
   ./cleanup_codebase.sh   # Perform the actual cleanup
   ./verify_cleanup.sh     # Verify that cleanup was successful
   ```

3. **Review the logs** to see what changes were made:
   - Master log file: `cleanup_master_log_*.txt`
   - Conflict reports: `conflict_reports/*/`
   - Backups of modified files: `backups/*/`

## Directory Structure After Cleanup

After running the cleanup scripts, the codebase will have the following structure:

```
Harmonic Universe/
├── app/             # Flask application package
├── frontend/        # Frontend code (React)
├── scripts/         # Canonical shell scripts
│   ├── build.sh     # Main build script
│   ├── start.sh     # Main start script
│   ├── utils/       # Utility scripts
├── static/          # Single source of truth for static files
│   ├── js/          # JavaScript files
│   ├── css/         # CSS files
│   ├── assets/      # Images and other assets
│   ├── react-fixes/ # React fix scripts
├── backups/         # Backups of original files
└── conflict_reports/ # Reports of identified conflicts
```

## Best Practices Going Forward

1. **Single Source of Truth**:

   - Use the `static` directory as the single source for all static files
   - Use the `scripts` directory for all shell scripts

2. **Symbolic Links**:

   - When files need to be in multiple locations, use symbolic links instead of duplicating files

3. **Documentation**:

   - Keep this README updated with any changes to the directory structure
   - Document any special files or dependencies

4. **Versioning**:
   - Use version numbers in comments within critical files
   - Avoid using filenames with timestamps or version numbers (e.g., `file.v2.js`)

## Troubleshooting

If you encounter issues during the cleanup process:

1. Check the log files for error messages
2. Restore from backups if needed (all original files are backed up in the `backups` directory)
3. Run the `verify_cleanup.sh` script to identify what might be missing or incorrect

## Notes

- The cleanup process is designed to be idempotent - running it multiple times should result in the same clean state
- All existing files are backed up before modification
- The cleanup focuses on structure and organization, not on modifying the actual application logic
