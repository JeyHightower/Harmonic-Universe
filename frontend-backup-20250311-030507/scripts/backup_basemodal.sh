#!/bin/bash

# Script to backup BaseModal files before removal
# This creates a backup in a "deprecated" directory with timestamp

# Create backup directory
BACKUP_DIR="src/deprecated/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Copy BaseModal files
cp src/components/common/BaseModal.jsx $BACKUP_DIR/BaseModal.jsx.bak
cp src/components/common/BaseModal.css $BACKUP_DIR/BaseModal.css.bak

# Log the backup
echo "BaseModal files backed up to $BACKUP_DIR"
echo "Backup completed on $(date)"

# Create a README in the backup directory
cat > $BACKUP_DIR/README.md << EOF
# BaseModal Backup

These files were backed up on $(date) before removing BaseModal.jsx from the codebase.

## Files
- BaseModal.jsx.bak - The original BaseModal component
- BaseModal.css.bak - The original BaseModal styles

## Reason for Removal
The BaseModal component was deprecated in favor of the standard Modal.jsx component.
All usages of BaseModal have been migrated to Modal.jsx for consistency across the application.

## Restoration
If you need to restore these files, copy them back to src/components/common/ and remove the .bak extension.
EOF

echo "Backup documentation created"
echo "Proceed with removal according to the basemodal_removal_plan.md"
