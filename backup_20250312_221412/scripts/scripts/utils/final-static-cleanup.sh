#!/bin/bash

echo "🧹 Starting final static cleanup..."

cd static || exit 1

# Remove all numbered duplicates
find . -type f -regextype posix-extended -regex ".*[0-9]\.js$" -delete
find . -type f -regextype posix-extended -regex ".* [0-9]\.js$" -delete
find . -type f -name "*copy*.js" -delete
find . -type f -name "* copy.js" -delete

# Remove specific duplicate patterns
rm -f *' 2.js' *' 3.js' *'.js.map'

# Keep only one version of each React-related file
for base in vendor-react react-hook-fix react-fix-loader react-context-fix hook-js-patcher hook-fix \
           react-version-checker react-polyfill react-force-expose react-error-handler react-diagnostics \
           redux-provider-fix early-warning-interceptor direct-hook-patcher final-hook-suppressor; do
    # Find the newest file matching the pattern
    newest=$(ls -t "$base"*.js 2>/dev/null | head -n1)
    if [ ! -z "$newest" ]; then
        echo "Keeping $newest"
        # Remove all other versions
        find . -name "$base*.js" ! -name "$(basename "$newest")" -delete
    fi
done

# Remove any remaining duplicate patterns
rm -f *' 2.js' *' 3.js' *' copy.js' *'.backup'

# Clean up empty directories
find . -type d -empty -delete

echo "✨ Final static cleanup complete!"
