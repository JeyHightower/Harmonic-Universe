#!/usr/bin/env node

/**
 * generate-ant-icons-fallback.js
 *
 * This script generates a fallback implementation of Ant Design icons
 * to prevent the application from breaking if the icon loading fails.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Generating Ant Design Icons fallback...');

// Define paths
const distDir = path.resolve(__dirname, '../dist');
const fallbackPath = path.join(distDir, 'ant-icons-fallback.js');

// Ensure the dist directory exists
if (!fs.existsSync(distDir)) {
  try {
    fs.mkdirSync(distDir, { recursive: true });
    console.log(`Created directory: ${distDir}`);
  } catch (error) {
    console.error(`Failed to create dist directory: ${error.message}`);
    process.exit(1);
  }
}

// Create the fallback script content
const fallbackScript = `
/**
 * Ant Design Icons Fallback
 *
 * This script provides fallback icons when the original Ant Design
 * icon chunks fail to load. It creates basic icon components that
 * maintain the same interface as the original icons.
 */

console.log('[Ant Icons] Loading fallback icons...');

// Create a minimal implementation of Ant Design icons
(function() {
  // Basic icon creation function
  function createIcon(name, theme = 'outlined') {
    return function IconComponent(props) {
      const { style = {}, className = '', ...restProps } = props || {};

      // Create a simple SVG element
      const svgProps = {
        ...restProps,
        className: \`anticon anticon-\${name} \${className}\`,
        style: { ...style },
      };

      return {
        $$typeof: Symbol.for('react.element'),
        type: 'span',
        props: {
          ...svgProps,
          children: [
            {
              $$typeof: Symbol.for('react.element'),
              type: 'svg',
              props: {
                viewBox: '64 64 896 896',
                focusable: 'false',
                'data-icon': name,
                width: '1em',
                height: '1em',
                fill: 'currentColor',
                'aria-hidden': 'true',
                children: {
                  $$typeof: Symbol.for('react.element'),
                  type: 'path',
                  props: {
                    d: 'M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z'
                  },
                  key: null
                }
              },
              key: null
            }
          ]
        },
        key: null
      };
    };
  }

  // Define IconContext for compatibility
  const IconContext = {
    Provider: function Provider(props) {
      return props.children;
    },
    Consumer: function Consumer(props) {
      return props.children({});
    }
  };

  // Mock createFromIconfontCN
  const createFromIconfontCN = function(options) {
    return function(props) {
      return {
        $$typeof: Symbol.for('react.element'),
        type: 'span',
        props: {
          className: 'anticon ' + (props.className || ''),
          style: props.style || {},
          children: []
        }
      };
    };
  };

  // Mock getTwoToneColor and setTwoToneColor
  function getTwoToneColor() {
    return '#1890ff';
  }

  function setTwoToneColor() {
    // Do nothing
  }

  // Define common icons that are frequently used
  const icons = {
    // Direction Icons
    UpOutlined: createIcon('up'),
    DownOutlined: createIcon('down'),
    LeftOutlined: createIcon('left'),
    RightOutlined: createIcon('right'),

    // Suggestion Icons
    CheckOutlined: createIcon('check'),
    CloseOutlined: createIcon('close'),
    CheckCircleOutlined: createIcon('check-circle'),
    CloseCircleOutlined: createIcon('close-circle'),
    InfoCircleOutlined: createIcon('info-circle'),
    ExclamationCircleOutlined: createIcon('exclamation-circle'),
    QuestionCircleOutlined: createIcon('question-circle'),

    // Form Icons
    SearchOutlined: createIcon('search'),
    EditOutlined: createIcon('edit'),
    DeleteOutlined: createIcon('delete'),
    FormOutlined: createIcon('form'),
    CopyOutlined: createIcon('copy'),
    ScissorOutlined: createIcon('scissor'),

    // Navigation Icons
    MenuOutlined: createIcon('menu'),
    MoreOutlined: createIcon('more'),
    HomeOutlined: createIcon('home'),
    AppstoreOutlined: createIcon('appstore'),
    SettingOutlined: createIcon('setting'),

    // Media Icons
    PictureOutlined: createIcon('picture'),
    PlayCircleOutlined: createIcon('play-circle'),
    FileOutlined: createIcon('file'),
    FolderOutlined: createIcon('folder'),

    // Utility Icons
    LoadingOutlined: createIcon('loading'),
    EyeOutlined: createIcon('eye'),
    EyeInvisibleOutlined: createIcon('eye-invisible'),
    PlusOutlined: createIcon('plus'),
    MinusOutlined: createIcon('minus'),

    // User Icons
    UserOutlined: createIcon('user'),
    TeamOutlined: createIcon('team'),

    // Metadata Icons
    StarOutlined: createIcon('star'),
    HeartOutlined: createIcon('heart'),

    // Add utilities to the exported object
    createFromIconfontCN,
    getTwoToneColor,
    setTwoToneColor,
    IconContext,
    IconProvider: IconContext.Provider
  };

  // Support filled versions of common icons
  icons.StarFilled = createIcon('star', 'filled');
  icons.HeartFilled = createIcon('heart', 'filled');
  icons.CheckCircleFilled = createIcon('check-circle', 'filled');
  icons.CloseCircleFilled = createIcon('close-circle', 'filled');
  icons.InfoCircleFilled = createIcon('info-circle', 'filled');
  icons.ExclamationCircleFilled = createIcon('exclamation-circle', 'filled');

  // Export to global scope for browser usage
  if (typeof window !== 'undefined') {
    window.AntDesignIcons = icons;

    // For backward compatibility
    window.__ANT_ICONS_LOADED__ = true;
    window.__ANT_ICONS_VERSION__ = '5.6.1';
  }

  // Support CommonJS if needed
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = icons;
  }

  // Support ES modules
  if (typeof exports !== 'undefined') {
    Object.keys(icons).forEach(key => {
      exports[key] = icons[key];
    });
  }
})();
`;

// Write the fallback script to file
try {
  fs.writeFileSync(fallbackPath, fallbackScript);
  console.log(`✅ Fallback script created at: ${fallbackPath}`);
} catch (error) {
  console.error(`Failed to write fallback script: ${error.message}`);
  process.exit(1);
}

// Check for index.html to add reference to the fallback script
const indexHtmlPath = path.join(distDir, 'index.html');

if (fs.existsSync(indexHtmlPath)) {
  try {
    let indexContent = fs.readFileSync(indexHtmlPath, 'utf8');

    // Add the fallback script to the head if it's not already there
    if (!indexContent.includes('ant-icons-fallback.js')) {
      console.log('Adding fallback script reference to index.html');

      // Insert before closing head tag
      indexContent = indexContent.replace(
        '</head>',
        '  <script src="/ant-icons-fallback.js"></script>\n</head>'
      );

      fs.writeFileSync(indexHtmlPath, indexContent);
      console.log('✅ Added fallback reference to index.html');
    } else {
      console.log('✅ Fallback script already referenced in index.html');
    }
  } catch (error) {
    console.error(`Error updating index.html: ${error.message}`);
  }
} else {
  console.warn(`⚠️ index.html not found at ${indexHtmlPath}`);
}

console.log('Ant Design Icons fallback generation complete!');
