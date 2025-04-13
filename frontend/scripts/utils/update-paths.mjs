/**
 * This script updates paths in the built HTML file to use relative paths
 * instead of absolute paths to resolve asset loading issues.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * Updates paths in built files to use relative paths
 * @param {string} distDir - Path to the dist directory
 */
export function updatePaths(distDir = join(process.cwd(), 'dist')) {
  const indexPath = join(distDir, 'index.html');

  if (!existsSync(indexPath)) {
    console.error('Error: index.html not found in dist directory');
    return;
  }

  // Read the HTML file
  let html = readFileSync(indexPath, 'utf8');

  // Replace absolute paths with relative paths
  // - Replace /assets/ with ./assets/
  // - Replace src="/ with src="./ 
  // - Replace href="/ with href="./ (but not for http/https links)
  html = html
    .replace(/(src|href)=["']\/assets\//g, '$1="./assets/')
    .replace(/src=["']\/(?!http|https)/g, 'src="./')
    .replace(/href=["']\/(?!http|https)/g, 'href="./');

  // Write the updated HTML back to the file
  writeFileSync(indexPath, html);

  console.log('Updated paths in index.html to use relative paths');

  // Now scan the assets directory for any JS files that might have absolute path references
  const assetsDir = join(distDir, 'assets');
  if (existsSync(assetsDir)) {
    const jsFiles = readdirSync(assetsDir).filter(file => file.endsWith('.js'));

    jsFiles.forEach(file => {
      const filePath = join(assetsDir, file);
      let content = readFileSync(filePath, 'utf8');

      // Convert URL references from /assets/ to ./assets/
      content = content.replace(/["']\/assets\//g, '"./assets/');

      // Handle other asset references that might be using absolute paths
      content = content.replace(/["']\/images\//g, '"./images/');

      writeFileSync(filePath, content);
    });

    console.log(`Updated paths in ${jsFiles.length} JS files`);
  }
}

// Allow command-line execution
if (import.meta.url === `file://${process.argv[1]}`) {
  updatePaths();
} 