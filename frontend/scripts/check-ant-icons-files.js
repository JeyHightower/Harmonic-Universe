import fs from 'fs';
import { globSync } from 'glob';
import { exec } from 'child_process';

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
        const tempFile = `${file}.temp.js`;

        // Create a small wrapper that imports the file to test
        const wrapper = `
      try {
        import('file://${process.cwd()}/${file}')
          .then(() => console.log('✅ No syntax errors'))
          .catch(err => {
            console.error('❌ Syntax error:', err.message);
            process.exit(1);
          });
      } catch (err) {
        console.error('❌ Syntax error:', err.message);
        process.exit(1);
      }
    `;

        fs.writeFileSync(tempFile, wrapper);

        exec(`node ${tempFile}`, (error, stdout, stderr) => {
            fs.unlinkSync(tempFile); // Clean up temp file

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
        process.exit(1);
    }
});
