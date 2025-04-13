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

// Constants
const ANT_ICONS_VERSION = '5.6.1';
const PROJECT_ROOT = path.resolve(__dirname, '../..');

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
    const distDir = path.join(PROJECT_ROOT, 'dist');
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
  
  const indexPath = path.join(PROJECT_ROOT, 'dist', 'index.html');
  
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
  
  const iconsDir = path.join(PROJECT_ROOT, 'node_modules', '@ant-design', 'icons');
  
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
            
            // Add error handler to the file
            const patchedContent = content.replace(
              'export default IconComponent;',
              `// Added by ant-icons.mjs
try {
  if (typeof IconComponent !== 'function') {
    IconComponent = function() { 
      return { "$$typeof": Symbol.for('react.element'), type: 'span', props: { className: 'anticon anticon-${iconFile.replace('.js', '')}' } };
    };
  }
} catch (e) {
  console.error('Error in Ant Icon component:', e);
}
export default IconComponent;`
            );
            
            // Write the patched content back
            fs.writeFileSync(filePath, patchedContent);
          }
        } catch (error) {
          console.error(`  Error patching ${iconFile}:`, error);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error patching Ant Icon modules:', error);
    return false;
  }
}

// Check for Ant Icons in imports
function checkAntIconsImports() {
  console.log('Checking for Ant Icons imports in project...');
  
  const srcDir = path.join(PROJECT_ROOT, 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.log('src directory not found, skipping import check');
    return false;
  }
  
  try {
    // Use grep to search for Ant Icons imports
    const grepCommand = process.platform === 'win32'
      ? 'findstr /s /i "@ant-design/icons" "*.js" "*.jsx" "*.ts" "*.tsx"'
      : 'grep -r "@ant-design/icons" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"';
    
    let importsFound = false;
    
    try {
      const result = execSync(grepCommand, { cwd: srcDir, encoding: 'utf8' });
      if (result && result.length > 0) {
        console.log('Found Ant Icons imports:');
        console.log(result.split('\n').slice(0, 5).join('\n') + (result.split('\n').length > 5 ? '\n...' : ''));
        importsFound = true;
      }
    } catch (error) {
      // grep returns non-zero if no matches, which causes execSync to throw
      console.log('No Ant Icons imports found');
    }
    
    return importsFound;
  } catch (error) {
    console.error('Error checking Ant Icons imports:', error);
    return false;
  }
}

// Main function
function main() {
  console.log('Running Ant Icons utilities...');
  
  // Check for Ant Icons in the project
  const hasAntIcons = checkAntIconsImports();
  
  if (hasAntIcons) {
    console.log('Ant Icons are used in this project, applying fixes...');
    
    // Patch Ant Icon modules
    patchAntIconModules();
    
    // Create and inject fallback
    createAntIconsFallback();
    injectAntIconsFallback();
  } else {
    console.log('No Ant Icons usage detected, skipping fixes');
  }
  
  console.log('✅ Ant Icons utilities completed successfully.');
}

// Export functions for individual use
export {
  createAntIconsFallback,
  injectAntIconsFallback,
  patchAntIconModules,
  checkAntIconsImports
};

// Run if directly executed
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
} 