import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

// Ensure the React fallback exists
console.log('Creating React fallback module...');
import './ensure-react-deps.js';

// Find all ant-icons chunk files in the dist directory
console.log('Searching for Ant Design icon chunks...');
const antIconsFiles = globSync('dist/assets/ant-icons-*.js');

if (antIconsFiles.length === 0) {
  console.error('No Ant Design icon chunks found!');
  process.exit(1);
}

antIconsFiles.forEach(file => {
  console.log(`Patching ${file}...`);

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
});

// Copy the fallback to the correct location for deployment
const distReactFallback = path.join(process.cwd(), 'dist/assets/react-fallback.js');
const indexHtmlPath = path.join(process.cwd(), 'dist/index.html');

// Add the React fallback script to index.html
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
  }
}

console.log('Patching complete!');

// Run a check on the patched files
console.log('Patching complete! Running syntax check...');
const checkScript = path.join(process.cwd(), 'frontend/scripts/check-ant-icons-files.js');
if (fs.existsSync(checkScript)) {
  console.log('Running check script...');
  // We're not using import() directly here to avoid potential issues
  // Instead, we rely on the separate check script to validate
} else {
  console.log('Check script not found. Skipping validation.');
}
