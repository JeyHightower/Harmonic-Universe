const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Running simplified build process...');

try {
  // Run the vite build
  console.log('Building with Vite...');
  execSync('vite build --mode production', { stdio: 'inherit' });

  // Generate the ant icons fallback
  console.log('Generating Ant Icons fallback...');
  execSync('node scripts/generate-ant-icons-fallback.js', { stdio: 'inherit' });

  // Copy the fallback to the dist directory
  const distDir = path.resolve(__dirname, 'dist');
  const assetsDir = path.join(distDir, 'assets');

  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // Add Ant Icons fallback reference to index.html
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    let indexContent = fs.readFileSync(indexPath, 'utf8');

    // Add the fallback script if not already present
    if (!indexContent.includes('ant-icons-fallback.js')) {
      indexContent = indexContent.replace(
        '</head>',
        '  <script src="/ant-icons-fallback.js"></script>\n</head>'
      );
      fs.writeFileSync(indexPath, indexContent);
      console.log('Added fallback reference to index.html');
    }
  }

  console.log('Build completed successfully');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
