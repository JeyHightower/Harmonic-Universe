import fs from 'fs';
import { globSync } from 'glob';
import { exec } from 'child_process';
import path from 'path';

console.log('Checking Ant Design Icon files for syntax issues...');

// Find all ant-icons chunk files in the dist directory
const antIconsFiles = globSync('dist/assets/ant-icons-*.js');

if (antIconsFiles.length === 0) {
    console.error('No Ant Design icon chunks found!');
    process.exit(1);
}

// Function to check JS file for syntax errors using Node
function checkFileSyntax(file) {
    return new Promise((resolve, reject) => {
        // Create a temporary HTML file that loads the script in a browser-like environment
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        const tempFile = path.join(tempDir, `test-${path.basename(file)}.html`);
        const absoluteFilePath = path.join(process.cwd(), file);

        // Create a test HTML file that includes the script and validates it
        const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Testing ${file}</title>
  <script>
    // Define React globals to avoid errors
    window.React = {
      createContext: function() {
        return {
          Provider: function() {},
          Consumer: function() {}
        };
      },
      createElement: function() { return {}; },
      isValidElement: function() { return true; }
    };

    // Define other potential missing dependencies
    window.IconContext = window.IconContext || window.React.createContext({});
    window.IconProvider = window.IconProvider || { version: "4.2.1" };
    window.version = "4.2.1";

    // Error handler
    window.onerror = function(message, source, lineno, colno, error) {
      console.error('ERROR:', message, 'at line', lineno, 'column', colno);
      document.body.innerHTML += '<div style="color:red">ERROR: ' + message + ' at line ' + lineno + '</div>';
      return true;
    };
  </script>
</head>
<body>
  <h1>Testing ${file}</h1>
  <div id="status">Loading...</div>

  <script>
    // Try to load the script
    try {
      var script = document.createElement('script');
      script.src = '${path.relative(tempDir, absoluteFilePath)}';
      script.onerror = function(error) {
        document.getElementById('status').innerHTML = '<span style="color:red">Failed to load: ' + error + '</span>';
      };
      script.onload = function() {
        document.getElementById('status').innerHTML = '<span style="color:green">Successfully loaded!</span>';
      };
      document.body.appendChild(script);
    } catch (e) {
      document.getElementById('status').innerHTML = '<span style="color:red">Exception: ' + e.message + '</span>';
    }
  </script>
</body>
</html>`;

        fs.writeFileSync(tempFile, testHtml);

        // Use a simple node script to check for syntax errors
        const jsTestFile = path.join(tempDir, `test-${path.basename(file)}.js`);
        const jsTestContent = `
import fs from 'fs';

try {
  // Read the file first to check for syntax errors when parsing
  const fileContent = fs.readFileSync('${absoluteFilePath}', 'utf8');
  console.log('✅ Successfully read the file');

  // Test if it can be evaluated without errors
  // Note: This is a simple test but won't catch runtime/browser-specific issues
  new Function(fileContent);
  console.log('✅ Successfully parsed as JavaScript');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}`;

        fs.writeFileSync(jsTestFile, jsTestContent);

        // Execute the test
        exec(`node ${jsTestFile}`, (error, stdout, stderr) => {
            // Always clean up temp files
            try {
                fs.unlinkSync(tempFile);
                fs.unlinkSync(jsTestFile);
            } catch (e) {
                // Ignore cleanup errors
            }

            if (error) {
                console.error(`❌ Error in ${file}:`, stdout || stderr);
                resolve(false);
            } else {
                console.log(`✅ ${file} - No syntax errors detected`);
                resolve(true);
            }
        });
    });
}

// Process each file
const checkPromises = antIconsFiles.map(file => {
    console.log(`Checking ${file}...`);
    return checkFileSyntax(file);
});

Promise.all(checkPromises).then(results => {
    const allPassed = results.every(result => result);
    if (allPassed) {
        console.log('All files passed syntax check! ✅');
    } else {
        console.error('Some files have syntax errors! ❌');
        // Don't fail the build - we're using these as diagnostic checks only
        console.log('WARNING: Continuing build despite errors');
    }
});
