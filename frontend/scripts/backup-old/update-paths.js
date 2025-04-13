/**
 * This script updates paths in the built HTML file to use relative paths
 * instead of absolute paths to resolve asset loading issues.
 */
const fs = require('fs');
const path = require('path');

// Path to the dist directory
const distDir = path.join(__dirname, 'dist');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('Error: index.html not found in dist directory');
  process.exit(1);
}

// Read the HTML file
let html = fs.readFileSync(indexPath, 'utf8');

// Replace absolute paths with relative paths
// - Replace /assets/ with ./assets/
// - Replace src="/ with src="./ 
// - Replace href="/ with href="./ (but not for http/https links)
html = html
  .replace(/(src|href)=["']\/assets\//g, '$1="./assets/')
  .replace(/src=["']\/(?!http|https)/g, 'src="./')
  .replace(/href=["']\/(?!http|https)/g, 'href="./');

// Write the updated HTML back to the file
fs.writeFileSync(indexPath, html);

console.log('Updated paths in index.html to use relative paths');

// Now scan the assets directory for any JS files that might have absolute path references
const assetsDir = path.join(distDir, 'assets');
if (fs.existsSync(assetsDir)) {
  const jsFiles = fs.readdirSync(assetsDir).filter(file => file.endsWith('.js'));

  jsFiles.forEach(file => {
    const filePath = path.join(assetsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Convert URL references from /assets/ to ./assets/
    content = content.replace(/["']\/assets\//g, '"./assets/');

    // Handle other asset references that might be using absolute paths
    content = content.replace(/["']\/images\//g, '"./images/');

    fs.writeFileSync(filePath, content);
  });

  console.log(`Updated paths in ${jsFiles.length} JS files`);
} 