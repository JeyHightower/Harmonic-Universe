const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// Determine the port - allow tests to override with TEST_PORT
const PORT = process.env.TEST_PORT || process.env.PORT || 10000;

// Ensure static directory exists
const staticDir = path.join(__dirname, 'static');
if (!fs.existsSync(staticDir)) {
    console.warn('Static directory not found, creating it...');
    fs.mkdirSync(staticDir, { recursive: true });

    // Create a minimal index.html if it doesn't exist
    const indexPath = path.join(staticDir, 'index.html');
    if (!fs.existsSync(indexPath)) {
        const minimalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
</head>
<body>
    <h1>Harmonic Universe</h1>
    <p>Welcome to the Harmonic Universe application.</p>
</body>
</html>`;
        fs.writeFileSync(indexPath, minimalHtml);
    }
}

// Serve static files
app.use(express.static(staticDir));

// Health check endpoints
const healthHandler = (req, res) => {
    res.status(200).json({"status": "healthy"});
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.get('/healthcheck', healthHandler);
app.get('/api/healthcheck', healthHandler);
app.get('/ping', healthHandler);
app.get('/api/ping', healthHandler);
app.get('/status', healthHandler);
app.get('/api/status', healthHandler);

// Serve index.html for any other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
