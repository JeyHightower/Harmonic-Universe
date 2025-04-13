/**
 * Core Ant Icons Utilities
 * 
 * This script combines various Ant Icons related utility functions:
 * - Ant Icons fallback generation
 * - Ant Icons patching
 * - Ant Icons modules checking
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptsRoot = path.resolve(__dirname, '..');
const frontendRoot = path.resolve(scriptsRoot, '..');

// Constants
const ANT_ICONS_VERSION = '5.6.1';

// Create Ant Icons fallback
function createAntIconsFallback() {
  console.log('Creating Ant Icons fallback...');
  
  const fallbackContent = `
// Ant Icons Fallback
// Generated on ${new Date().toISOString()}

// Ensure React is available
window.React = window.React || {
  createContext: function(defaultValue) {
    return {
      Provider: function(props) { return props.children || null; },
      Consumer: function(props) { return props.children ? props.children(defaultValue) : null; }
    };
  }
};

// Create fallback icon component factory
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

// Create Icon context
window.IconContext = window.IconContext || window.React.createContext({
  prefixCls: 'anticon',
  rtl: false
});

// Basic fallback icons
window.AntDesignIcons = window.AntDesignIcons || {
  // Common icons
  CloseOutlined: createIconComponent('close'),
  CheckOutlined: createIconComponent('check'),
  LoadingOutlined: createIconComponent('loading'),
  SearchOutlined: createIconComponent('search'),
  DownOutlined: createIconComponent('down'),
  UpOutlined: createIconComponent('up'),
  LeftOutlined: createIconComponent('left'),
  RightOutlined: createIconComponent('right'),
  MenuOutlined: createIconComponent('menu'),
  UserOutlined: createIconComponent('user'),
  SettingOutlined: createIconComponent('setting'),
  HomeOutlined: createIconComponent('home'),
  PlusOutlined: createIconComponent('plus'),
  MinusOutlined: createIconComponent('minus'),
  DeleteOutlined: createIconComponent('delete'),
  EditOutlined: createIconComponent('edit'),
  InfoCircleOutlined: createIconComponent('info-circle'),
  QuestionCircleOutlined: createIconComponent('question-circle'),
  ExclamationCircleOutlined: createIconComponent('exclamation-circle'),
  EyeOutlined: createIconComponent('eye'),
  EyeInvisibleOutlined: createIconComponent('eye-invisible'),
  ArrowLeftOutlined: createIconComponent('arrow-left'),
  ArrowRightOutlined: createIconComponent('arrow-right'),
  ArrowUpOutlined: createIconComponent('arrow-up'),
  ArrowDownOutlined: createIconComponent('arrow-down'),
  
  // API functions
  createFromIconfontCN: function() {
    return function() { return null; };
  },
  getTwoToneColor: function() { return '#1890ff'; },
  setTwoToneColor: function() {}
};

// Apply version
window.AntDesignIcons.version = "${ANT_ICONS_VERSION}";
window.IconContext.version = "${ANT_ICONS_VERSION}";

console.log("[Ant Icons Fallback] Loaded fallback icons with version:", "${ANT_ICONS_VERSION}");
`;

  try {
    // Create the dist directory if it doesn't exist
    const distDir = path.join(frontendRoot, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    
    // Write the fallback file
    const fallbackPath = path.join(distDir, 'ant-icons-fallback.js');
    fs.writeFileSync(fallbackPath, fallbackContent);
    console.log(`Created Ant Icons fallback at: ${fallbackPath}`);
    
    return true;
  } catch (error) {
    console.error('Error creating Ant Icons fallback:', error);
    return false;
  }
}

// Add Ant Icons fallback script to index.html
function injectAntIconsFallback() {
  console.log('Injecting Ant Icons fallback into index.html...');
  
  const indexPath = path.join(frontendRoot, 'dist', 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.error('index.html not found at:', indexPath);
    return false;
  }
  
  try {
    // Read index.html
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check if the script is already included
    if (indexContent.includes('ant-icons-fallback.js')) {
      console.log('Ant Icons fallback script already present in index.html');
      return true;
    }
    
    // Insert the script tag before the closing head tag
    const scriptTag = '<script src="/ant-icons-fallback.js"></script>';
    indexContent = indexContent.replace('</head>', `  ${scriptTag}\n</head>`);
    
    // Write the updated content back
    fs.writeFileSync(indexPath, indexContent);
    console.log('Successfully injected Ant Icons fallback script into index.html');
    
    return true;
  } catch (error) {
    console.error('Error injecting Ant Icons fallback script:', error);
    return false;
  }
}

// Check and patch Ant Icon module files
function patchAntIconModules() {
  console.log('Checking for Ant Icon modules...');
  
  const iconsDir = path.join(frontendRoot, 'node_modules', '@ant-design', 'icons');
  
  if (!fs.existsSync(iconsDir)) {
    console.log('Ant Icons directory not found, skipping patch');
    return false;
  }
  
  try {
    console.log('Found Ant Icons, checking for problematic files...');
    
    // Paths to check
    const iconsEsDir = path.join(iconsDir, 'es', 'icons');
    const iconsTsxDir = path.join(iconsDir, 'es', 'components');
    
    // Fix ES modules
    if (fs.existsSync(iconsEsDir)) {
      console.log('Patching ES icon modules...');
      
      // Get list of icon files
      const iconFiles = fs.readdirSync(iconsEsDir).filter(file => file.endsWith('.js'));
      
      let patchedCount = 0;
      
      // Process each icon file
      for (const iconFile of iconFiles) {
        if (iconFile === 'index.js') continue;
        
        const filePath = path.join(iconsEsDir, iconFile);
        try {
          // Read the file content
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Check if file needs patching (doesn't have our patch)
          if (!content.includes('// Added by ant-icons.mjs')) {
            // Create backup
            if (!fs.existsSync(`${filePath}.bak`)) {
              fs.copyFileSync(filePath, `${filePath}.bak`);
            }
            
            // Add resilient error handling to each icon module
            const patchedContent = content.replace(
              /export default IconComponent;/,
              `// Added by ant-icons.mjs - resilient error handling
try {
  if (typeof IconComponent.displayName !== 'string') {
    IconComponent.displayName = 'AntIcon${iconFile.replace('.js', '')}';
  }
} catch (e) {
  console.warn('Failed to patch icon component:', e);
}
export default IconComponent;`
            );
            
            // Write the patched content back
            fs.writeFileSync(filePath, patchedContent);
            patchedCount++;
          }
        } catch (err) {
          console.error(`Error patching ${iconFile}:`, err);
        }
      }
      
      console.log(`Patched ${patchedCount} Ant Icon modules`);
    } else {
      console.log('ES icons directory not found, skipping patch');
    }
    
    return true;
  } catch (error) {
    console.error('Error patching Ant Icon modules:', error);
    return false;
  }
}

// Main function to check and fix everything related to Ant Icons
function processAntIcons() {
  console.log('Processing Ant Icons...');
  
  // Create fallbacks
  createAntIconsFallback();
  injectAntIconsFallback();
  
  // Check modules
  patchAntIconModules();
  
  console.log('Ant Icons processing complete');
  return true;
}

// Export functions
export {
  createAntIconsFallback,
  injectAntIconsFallback,
  patchAntIconModules,
  processAntIcons as default
};

// Run if directly executed
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  processAntIcons();
} 