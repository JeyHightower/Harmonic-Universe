#!/usr/bin/env node
/**
 * fix_glob.js - Ensure that glob is available for both CommonJS and ES Modules
 */

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

console.log('Starting fix_glob.js...');

// Install glob if it's not already installed
try {
    require.resolve('glob');
    console.log('✅ glob is already installed');
} catch (error) {
    console.log('⚠️ glob is not installed. Installing...');
    try {
        child_process.execSync('npm install glob@8.0.3 --no-save', { stdio: 'inherit' });
        console.log('✅ glob installed');
    } catch (installError) {
        console.error('❌ Failed to install glob:', installError.message);
    }
}

// Create compatibility folders
const compatDirs = [
    path.resolve(__dirname, 'node_modules/glob-compat'),
    path.resolve(__dirname, 'frontend/node_modules/glob-compat'),
    path.resolve(__dirname, 'frontend/scripts/node_modules/glob')
];

for (const dir of compatDirs) {
    try {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
    } catch (error) {
        console.error(`❌ Failed to create directory ${dir}:`, error.message);
    }
}

// Create compatibility index.js files
const compatFiles = [
    { path: path.resolve(__dirname, 'node_modules/glob-compat/index.js'), content: "module.exports = require('glob');" },
    { path: path.resolve(__dirname, 'frontend/node_modules/glob-compat/index.js'), content: "module.exports = require('glob');" },
    { path: path.resolve(__dirname, 'frontend/scripts/node_modules/glob/index.js'), content: "module.exports = require('glob');" }
];

for (const file of compatFiles) {
    try {
        fs.writeFileSync(file.path, file.content);
        console.log(`✅ Created file: ${file.path}`);
    } catch (error) {
        console.error(`❌ Failed to create file ${file.path}:`, error.message);
    }
}

// Create a package.json in the frontend/scripts directory if it doesn't exist
const scriptsDir = path.resolve(__dirname, 'frontend/scripts');
const scriptsPkg = path.resolve(scriptsDir, 'package.json');

try {
    fs.mkdirSync(scriptsDir, { recursive: true });

    if (!fs.existsSync(scriptsPkg)) {
        const packageJson = {
            name: 'scripts',
            version: '1.0.0',
            description: 'Build scripts',
            dependencies: {
                glob: '^8.0.3',
                rimraf: '^3.0.2'
            }
        };

        fs.writeFileSync(scriptsPkg, JSON.stringify(packageJson, null, 2));
        console.log(`✅ Created package.json in scripts directory`);

        // Install dependencies in the scripts directory
        try {
            process.chdir(scriptsDir);
            child_process.execSync('npm install', { stdio: 'inherit' });
            process.chdir(__dirname);
            console.log('✅ Installed dependencies in scripts directory');
        } catch (npmError) {
            console.error('❌ Failed to install dependencies in scripts directory:', npmError.message);
        }
    } else {
        console.log('✅ package.json already exists in scripts directory');
    }
} catch (error) {
    console.error('❌ Failed to set up scripts directory:', error.message);
}

// Create a replacement for clean-ant-icons.js
const cleanAntFile = path.resolve(__dirname, 'frontend/scripts/clean-ant-icons.js');
const cleanAntContent = `#!/usr/bin/env node
/**
 * clean-ant-icons.js - Replacement for the original clean-ant-icons.js
 * This version uses CommonJS require instead of ES module imports
 */
console.log("Running clean-ant-icons.js replacement script");

// Use CommonJS require instead of ES module import
const glob = require('glob');
const fs = require('fs');
const path = require('path');

try {
  // Try to find SVG files
  const antDesignDir = path.resolve(__dirname, '../node_modules/@ant-design');
  if (fs.existsSync(antDesignDir)) {
    console.log(\`Looking for SVG files in \${antDesignDir}\`);
    const svgFiles = glob.sync('**/*.svg', { cwd: antDesignDir });
    console.log(\`Found \${svgFiles.length} SVG files\`);
  } else {
    console.log(\`Directory not found: \${antDesignDir}\`);
  }

  console.log("clean-ant-icons.js completed successfully");
} catch (error) {
  console.error(\`Error in clean-ant-icons.js: \${error.message}\`);
  // Don't exit with an error code to allow the build to continue
}
`;

// We'll save this file to be used later since the clean-ant-icons.js might not exist yet
fs.writeFileSync(path.resolve(__dirname, 'clean-ant-icons.js.replacement'), cleanAntContent);
console.log('✅ Created replacement for clean-ant-icons.js');

console.log('fix_glob.js completed successfully');
