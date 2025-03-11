#!/bin/bash

# Script to remove BaseModal files after successful testing
# Make sure to run backup_basemodal.sh first!

echo "Starting BaseModal removal process..."

# Confirm with user
read -p "Have you run the backup script and verified all tests pass? (y/n) " confirm
if [[ $confirm != "y" ]]; then
    echo "Aborting removal. Please run backup_basemodal.sh first and test thoroughly."
    exit 1
fi

# Check if files exist
if [ ! -f "src/components/common/BaseModal.jsx" ] || [ ! -f "src/components/common/BaseModal.css" ]; then
    echo "BaseModal files not found. They may have already been removed."
    exit 1
fi

# Remove files
echo "Removing BaseModal.jsx..."
rm src/components/common/BaseModal.jsx

echo "Removing BaseModal.css..."
rm src/components/common/BaseModal.css

echo "BaseModal files have been removed."

# Verify removal
if [ -f "src/components/common/BaseModal.jsx" ] || [ -f "src/components/common/BaseModal.css" ]; then
    echo "WARNING: Some files could not be removed. Please check permissions."
else
    echo "Removal successful!"
fi

echo "Complete! Run your tests again to ensure everything still works."
