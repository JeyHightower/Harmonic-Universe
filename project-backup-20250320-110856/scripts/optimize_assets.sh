#!/bin/bash
set -e

echo "=== Starting Frontend Asset Optimization ==="

# Install required tools if they don't exist
if ! command -v uglifyjs &> /dev/null; then
    echo "Installing UglifyJS..."
    npm install -g uglify-js
fi

if ! command -v cleancss &> /dev/null; then
    echo "Installing CleanCSS..."
    npm install -g clean-css-cli
fi

if ! command -v svgo &> /dev/null; then
    echo "Installing SVGO..."
    npm install -g svgo
fi

# Create output directory
mkdir -p static/optimized

# Optimize JavaScript files
echo "Optimizing JavaScript files..."
for file in static/*.js; do
    if [ -f "$file" ]; then
        filename=$(basename -- "$file")
        echo "  Processing $filename"
        uglifyjs "$file" --compress --mangle --output "static/optimized/$filename"
    fi
done

# Optimize CSS files
echo "Optimizing CSS files..."
for file in static/*.css; do
    if [ -f "$file" ]; then
        filename=$(basename -- "$file")
        echo "  Processing $filename"
        cleancss -o "static/optimized/$filename" "$file"
    fi
done

# Optimize SVG files
echo "Optimizing SVG files..."
for file in static/*.svg; do
    if [ -f "$file" ]; then
        filename=$(basename -- "$file")
        echo "  Processing $filename"
        svgo -i "$file" -o "static/optimized/$filename"
    fi
done

# Optimize images
echo "Optimizing images..."
if command -v convert &> /dev/null; then
    for file in static/*.{jpg,jpeg,png}; do
        if [ -f "$file" ]; then
            filename=$(basename -- "$file")
            echo "  Processing $filename"
            convert "$file" -strip -interlace Plane -quality 85% "static/optimized/$filename"
        fi
    done
else
    echo "ImageMagick not installed, skipping image optimization"
fi

# Copy HTML files and other assets
echo "Copying HTML and other files..."
cp static/*.html static/optimized/
cp static/*.ico static/optimized/ 2>/dev/null || true
cp static/*.txt static/optimized/ 2>/dev/null || true

# Generate asset manifest
echo "Generating asset manifest..."
cat > static/optimized/assets.json << EOF
{
  "generated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "files": {
EOF

# Add all files to manifest
first=true
for file in static/optimized/*; do
    if [ -f "$file" ]; then
        filename=$(basename -- "$file")
        size=$(wc -c < "$file")
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> static/optimized/assets.json
        fi
        echo "    \"$filename\": { \"size\": $size }" >> static/optimized/assets.json
    fi
done

# Close JSON
cat >> static/optimized/assets.json << EOF
  }
}
EOF

# Report results
echo "=== Optimization Complete ==="
echo "Original size: $(du -sh static | cut -f1)"
echo "Optimized size: $(du -sh static/optimized | cut -f1)"
echo "Savings: $(echo "scale=2; (1 - $(du -b static/optimized | cut -f1) / $(du -b static | cut -f1)) * 100" | bc)%"

# Offer to replace original files
read -p "Replace original files with optimized versions? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Replacing original files..."
    cp -r static/optimized/* static/
    echo "Done!"
fi
