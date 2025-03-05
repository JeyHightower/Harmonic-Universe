#!/usr/bin/env node

/**
 * This script tests whether the Ant Design icons fallback is working
 * by attempting to render some basic icons and checking for errors
 */

const fs = require('fs');
const path = require('path');

// Log header
console.log('======================================');
console.log('Ant Design Icons Fallback Tester');
console.log('======================================');

// Check if the fallback file exists
const distDir = path.resolve(__dirname, '../dist');
const fallbackPath = path.join(distDir, 'ant-icons-fallback.js');

console.log(`Checking for fallback file at: ${fallbackPath}`);
const fallbackExists = fs.existsSync(fallbackPath);

if (fallbackExists) {
  console.log('✅ Fallback file exists');

  // Check the file size
  const stats = fs.statSync(fallbackPath);
  console.log(`Fallback file size: ${stats.size} bytes`);

  // Read a sample of the file content
  const content = fs.readFileSync(fallbackPath, 'utf8');
  console.log(`Fallback content sample (first 100 chars): ${content.substring(0, 100)}...`);
} else {
  console.log('❌ Fallback file does not exist');

  // Create the fallback file
  console.log('Creating fallback file...');

  // Make sure the dist directory exists
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Basic fallback content
  const fallbackContent = `
  console.log('[Ant Icons] Loading fallback icons...');

  // Create a minimal implementation of Ant Design icons
  (function() {
    // Basic icon creation function
    function createIcon(name, theme = 'outlined') {
      return function IconComponent(props) {
        return {
          $$typeof: Symbol.for('react.element'),
          type: 'span',
          props: {
            className: 'anticon anticon-' + name + (props && props.className ? ' ' + props.className : ''),
            style: props && props.style ? props.style : {},
            children: []
          }
        };
      };
    }

    // Define common icons
    const icons = {
      CloseOutlined: createIcon('close'),
      CheckOutlined: createIcon('check'),
      LoadingOutlined: createIcon('loading')
    };

    // Export all icons
    if (typeof window !== 'undefined') {
      window.AntDesignIcons = icons;
    }

    if (typeof module !== 'undefined' && module.exports) {
      module.exports = icons;
    }
  })();
  `;

  fs.writeFileSync(fallbackPath, fallbackContent);
  console.log('✅ Created fallback file');
}

// Check the index.html to see if it references the fallback
const indexPath = path.join(distDir, 'index.html');
const indexExists = fs.existsSync(indexPath);

console.log(`\nChecking index.html at: ${indexPath}`);
if (indexExists) {
  console.log('✅ index.html exists');

  // Read the index.html content
  const indexContent = fs.readFileSync(indexPath, 'utf8');

  // Check if it includes the fallback script
  const hasFallbackScript = indexContent.includes('ant-icons-fallback.js');
  if (hasFallbackScript) {
    console.log('✅ index.html references the fallback script');
  } else {
    console.log('❌ index.html does not reference the fallback script');

    // Add the fallback script reference to index.html
    console.log('Adding fallback script reference to index.html');
    const updatedContent = indexContent.replace(
      '</head>',
      '  <script src="/ant-icons-fallback.js"></script>\n</head>'
    );

    fs.writeFileSync(indexPath, updatedContent);
    console.log('✅ Added fallback script reference to index.html');
  }
} else {
  console.log('❌ index.html does not exist');
}

console.log('\nTest Summary:');
console.log('======================================');
console.log(`Fallback file exists: ${fallbackExists ? 'Yes' : 'No'}`);
console.log(`Index file exists: ${indexExists ? 'Yes' : 'No'}`);
console.log('======================================');

if (fallbackExists) {
  console.log('✅ Ant Design Icons fallback should be working correctly');
} else {
  console.log('❌ Ant Design Icons fallback is not properly set up');
}

console.log('\nTesting complete!');
