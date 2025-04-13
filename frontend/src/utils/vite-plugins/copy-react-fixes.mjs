import fs from 'fs';
import path from 'path';

/**
 * Vite plugin to copy React fixes to static directory
 * This ensures the fixes are available at runtime through direct script tags
 */
export default function copyReactFixesPlugin() {
  return {
    name: 'copy-react-fixes',
    
    // Hook into the closeBundle hook to copy files after build
    closeBundle: {
      // Use sequential true to ensure this runs after other plugins
      sequential: true,
      handler: async () => {
        const srcDir = path.resolve('src/utils/react-fixes');
        const destDir = path.resolve('dist/static/react-fixes');
        
        // Ensure destination directory exists
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        // Get all files from source directory
        const files = fs.readdirSync(srcDir);
        
        // Copy each file to destination
        files.forEach(file => {
          if (file.endsWith('.js')) {
            const srcPath = path.join(srcDir, file);
            const destPath = path.join(destDir, file);
            
            // Copy file
            fs.copyFileSync(srcPath, destPath);
            console.log(`Copied React fix: ${file} to static/react-fixes`);
          }
        });
        
        console.log('All React fixes copied to build output');
      }
    }
  };
} 