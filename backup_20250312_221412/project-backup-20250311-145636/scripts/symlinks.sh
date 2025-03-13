#!/bin/bash
# Create symbolic links for all static files to handle both path patterns

# Set the base directories
STATIC_DIR="static"
PUBLIC_DIR="frontend/public"

# Make sure static directory exists
mkdir -p $STATIC_DIR

# Create symbolic links from root to static dir for backward compatibility
echo "Creating symbolic links from root to static for backward compatibility..."
for script in $STATIC_DIR/*.js; do
  filename=$(basename "$script")
  # Create a symbolic link in the root directory pointing to the static file
  ln -sf "$(pwd)/$script" "$(pwd)/$filename"
  echo "✅ Created symbolic link: /$filename -> /static/$filename"
done

# Create .htaccess file to handle redirections (for servers that support it)
echo "Creating .htaccess file for path redirection..."
cat > .htaccess << 'HTACCESS'
# Redirect script requests to the static directory
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^([^/]+\.js)$ /static/$1 [L]
</IfModule>
HTACCESS

echo "✅ Created symlinks.sh and .htaccess for path mapping"
