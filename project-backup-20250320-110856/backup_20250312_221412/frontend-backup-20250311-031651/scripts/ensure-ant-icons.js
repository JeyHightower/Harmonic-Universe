/**
 * Ensure Ant Icons Script
 *
 * This script ensures that Ant Design Icons loads correctly
 * and provides fallback mechanisms if the icons fail to load.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file and directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const distDir = path.resolve(__dirname, '../dist');
const indexHtmlPath = path.join(distDir, 'index.html');

console.log('Running ensure-ant-icons.js...');
console.log(`Checking index.html at: ${indexHtmlPath}`);

// Ensure the dist directory exists
if (!fs.existsSync(distDir)) {
    console.error(`Error: dist directory does not exist at ${distDir}`);
    process.exit(1);
}

// Check if index.html exists
if (!fs.existsSync(indexHtmlPath)) {
    console.error(`Error: index.html not found at ${indexHtmlPath}`);
    process.exit(1);
}

try {
    // Read the index.html file
    let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

    // Check if our script is already present
    if (htmlContent.includes('window.__ANT_ICONS_FALLBACK_HANDLER__')) {
        console.log('Ant Icons fallback handler already present in index.html');
    } else {
        console.log('Adding Ant Icons fallback handler to index.html');

        // Create the script to handle Ant Icons loading errors
        const fallbackScript = `
    <script>
      // Ant Design Icons fallback handler
      window.__ANT_ICONS_VERSION__ = "5.6.1";
      window.__ANT_ICONS_FALLBACK_HANDLER__ = function() {
        console.log("Running Ant Icons fallback handler");

        // Create basic icon component factory
        function createIconComponent(name) {
          return function(props) {
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

        // Create basic icons
        window.AntDesignIcons = {
          // Common icons
          CloseOutlined: createIconComponent('close'),
          CheckOutlined: createIconComponent('check'),
          LoadingOutlined: createIconComponent('loading'),
          DownOutlined: createIconComponent('down'),
          UpOutlined: createIconComponent('up'),
          LeftOutlined: createIconComponent('left'),
          RightOutlined: createIconComponent('right'),

          // API functions
          createFromIconfontCN: function() {
            return function() { return null; };
          },
          getTwoToneColor: function() { return '#1890ff'; },
          setTwoToneColor: function() {}
        };
      };

      // Set timeout to check if icons loaded correctly
      setTimeout(function() {
        if (!window.AntDesignIcons) {
          console.warn("Ant Design Icons not loaded correctly, applying fallback");
          window.__ANT_ICONS_FALLBACK_HANDLER__();
        }
      }, 1000);
    </script>`;

        // Insert the script before the closing head tag
        htmlContent = htmlContent.replace('</head>', fallbackScript + '\n</head>');

        // Write the updated content back to index.html
        fs.writeFileSync(indexHtmlPath, htmlContent);
        console.log('Successfully added Ant Icons fallback handler to index.html');
    }
} catch (error) {
    console.error(`Error processing index.html: ${error.message}`);
    process.exit(1);
}

console.log('ensure-ant-icons.js completed successfully');
