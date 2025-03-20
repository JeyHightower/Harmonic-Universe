const express = require('express');
const path = require('path');
const app = express();

// Serve static files from multiple directories for redundancy
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use(express.static(path.join(__dirname, 'static')));  // Also serve from root for backward compatibility

// Create redirects for common missing scripts
app.get('/:script.js', (req, res, next) => {
    const scriptName = req.params.script;
    // Check if this script exists in /static/
    const staticPath = path.join(__dirname, 'static', `${scriptName}.js`);
    if (fs.existsSync(staticPath)) {
        return res.redirect(`/static/${scriptName}.js`);
    }
    next();
});

// Default route serves index.html for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});
