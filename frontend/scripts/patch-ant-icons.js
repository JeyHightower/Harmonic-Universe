import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

// Get the current working directory and determine if we're already in frontend
const cwd = process.cwd();
const isInFrontend = cwd.endsWith('/frontend') || cwd.endsWith('\\frontend');
console.log(`Current working directory: ${cwd}`);
console.log(`Is in frontend directory: ${isInFrontend}`);

// First ensure React fallback script exists
try {
  console.log('Creating React fallback module...');
  // Import the ensure-react-deps script
  const importPath = isInFrontend ? './ensure-react-deps.js' : './frontend/scripts/ensure-react-deps.js';

  // Use dynamic import with then/catch for error handling
  import(importPath)
    .then(() => {
      console.log('Successfully created React fallback');
      // Continue with patching after React fallback is created
      patchAntIcons();
    })
    .catch(error => {
      console.error(`Warning: Error creating React fallback: ${error.message}`);
      console.log('Continuing with patching anyway...');
      patchAntIcons();
    });
} catch (error) {
  console.error(`Warning: Could not import ensure-react-deps.js: ${error.message}`);
  console.log('Continuing with patching anyway...');
  // Still try to patch the icons even if fallback creation fails
  patchAntIcons();
}

// Main function to patch the ant icons files
function patchAntIcons() {
  // Find all ant-icons chunk files in the dist directory
  console.log('Searching for Ant Design icon chunks...');

  const distDir = path.join(cwd, 'dist');
  const pattern = path.join(distDir, 'assets/ant-icons-*.js');
  console.log(`Looking for files matching: ${pattern}`);

  let antIconsFiles;
  try {
    antIconsFiles = globSync(pattern);
    console.log(`Found ${antIconsFiles.length} icon files to patch.`);
  } catch (error) {
    console.error(`Error searching for icon files: ${error.message}`);
    antIconsFiles = [];
  }

  if (antIconsFiles.length === 0) {
    console.warn('No Ant Design icon chunks found. Continuing anyway.');
  }

  // Process each found icon file
  antIconsFiles.forEach(file => {
    console.log(`Patching ${file}...`);

    try {
      let content = fs.readFileSync(file, 'utf8');
      let originalContent = content; // Keep original for comparison

      // Add import for our React fallback at the beginning of the file
      const importFallback = `
// Import React fallback module to ensure dependencies exist
import '/assets/react-fallback.js';
`;

      // Create a more comprehensive patch to handle multiple potential issues
      const headerPatch = `
// ==== BEGIN PATCH FOR ANT DESIGN ICONS ====
// This patch ensures version is available and creates mock implementations for missing functionalities

// Mock version access
var version = "4.2.1";
window.__ANT_ICONS_VERSION__ = "4.2.1";
// ==== END PATCH ====
`;

      // Add our patches to the content
      content = importFallback + headerPatch + content;

      // Write the patched file
      fs.writeFileSync(file, content);

      // Log success
      if (content !== originalContent) {
        console.log(`✅ Patched ${file}`);
      } else {
        console.log(`⚠️ No changes made to ${file}`);
      }
    } catch (error) {
      console.error(`Error patching ${file}: ${error.message}`);
    }
  });

  // Add the React fallback script to index.html
  try {
    const indexHtmlPath = path.join(cwd, 'dist/index.html');

    if (fs.existsSync(indexHtmlPath)) {
      console.log('Adding React fallback to index.html...');
      let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

      // Only add if not already present
      if (!indexHtml.includes('react-fallback.js')) {
        indexHtml = indexHtml.replace(
          '</head>',
          '  <script src="/assets/react-fallback.js"></script>\n  </head>'
        );
        fs.writeFileSync(indexHtmlPath, indexHtml);
        console.log('✅ Added React fallback to index.html');
      } else {
        console.log('Fallback already in index.html');
      }
    } else {
      console.warn(`Could not find index.html at ${indexHtmlPath}`);
    }
  } catch (error) {
    console.error(`Error updating index.html: ${error.message}`);
  }

  console.log('Patching complete!');
}
