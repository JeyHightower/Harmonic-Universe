import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the root directory and node_modules directory
const rootDir = path.resolve(__dirname, '..');
const nodeModulesDir = path.resolve(rootDir, 'node_modules');

// Function to clean index.js file
function cleanIndexFile() {
    console.log('Cleaning index.js file...');

    // Define the path to the index.js file
    const indexFilePath = path.resolve(nodeModulesDir, '@ant-design/icons/es/icons/index.js');
    const libIndexFilePath = path.resolve(nodeModulesDir, '@ant-design/icons/lib/icons/index.js');

    try {
        // Check if the file exists
        if (fs.existsSync(indexFilePath)) {
            // Read the file content
            let content = fs.readFileSync(indexFilePath, 'utf8');

            // Remove any existing SVG declarations with a more comprehensive regex
            // This will catch declarations with different comment styles and variable names
            const svgRegex = /(\/\*.*?\*\/\s*|\/\/.*?\n\s*)?var\s+\w+Svg\s*=\s*{[\s\S]*?};|\/\/\s*Added by fix-ant-icons\.js[\s\S]*?};|const\s+\w+Svg\s*=\s*{[\s\S]*?};/g;
            content = content.replace(svgRegex, '// Removed SVG declaration\n');

            // Write the cleaned content back to the file
            fs.writeFileSync(indexFilePath, content, 'utf8');
            console.log('✅ Successfully cleaned index.js file!');
        } else {
            console.log('⚠️ index.js file not found!');
        }

        // Also clean the lib/icons/index.js file if it exists
        if (fs.existsSync(libIndexFilePath)) {
            // Read the file content
            let content = fs.readFileSync(libIndexFilePath, 'utf8');

            // Remove any existing SVG declarations with a more comprehensive regex
            const svgRegex = /(\/\*.*?\*\/\s*|\/\/.*?\n\s*)?var\s+\w+Svg\s*=\s*{[\s\S]*?};|\/\/\s*Added by fix-ant-icons\.js[\s\S]*?};|const\s+\w+Svg\s*=\s*{[\s\S]*?};/g;
            content = content.replace(svgRegex, '// Removed SVG declaration\n');

            // Write the cleaned content back to the file
            fs.writeFileSync(libIndexFilePath, content, 'utf8');
            console.log('✅ Successfully cleaned lib/icons/index.js file!');
        } else {
            console.log('⚠️ lib/icons/index.js file not found!');
        }
    } catch (error) {
        console.error(`❌ Error cleaning index.js file: ${error.message}`);
    }
}

// Execute the function
cleanIndexFile();
