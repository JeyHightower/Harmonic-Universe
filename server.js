const express = require('express');
const path = require('path');

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Make sure you're using the correct port
const PORT = process.env.PORT || 8000;

// Make sure static files are served first
app.use(express.static(path.join(__dirname, 'static')));

// Health check endpoints
const healthHandler = (req, res) => {
    res.status(200).send('OK');
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.get('/healthcheck', healthHandler);
app.get('/api/healthcheck', healthHandler);
app.get('/ping', healthHandler);
app.get('/api/ping', healthHandler);
app.get('/status', healthHandler);
app.get('/api/status', healthHandler);

// Mock authentication endpoints
app.post('/api/auth/register', (req, res) => {
    res.status(201).json({
        id: '123',
        username: req.body.username || 'testuser',
        email: req.body.email || 'test@example.com',
        token: 'mock-jwt-token'
    });
});

app.post('/api/auth/login', (req, res) => {
    res.status(200).json({
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        user: {
            id: '123',
            username: req.body.username || 'testuser',
            email: req.body.email || 'test@example.com'
        }
    });
});

app.post('/api/auth/refresh', (req, res) => {
    res.status(200).json({
        token: 'new-mock-jwt-token'
    });
});

// Mock user endpoints
app.get('/api/users/me', (req, res) => {
    res.status(200).json({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        profile: {
            name: 'Test User',
            bio: 'Test user bio'
        }
    });
});

app.put('/api/users/me', (req, res) => {
    res.status(200).json({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        profile: {
            name: req.body.profile?.name || 'Updated Name',
            bio: req.body.profile?.bio || 'Updated bio'
        }
    });
});

// Mock universe endpoints
let universes = [];

app.post('/api/universes/', (req, res) => {
    const newUniverse = {
        id: Date.now().toString(),
        name: req.body.name || 'Test Universe',
        description: req.body.description || 'Test description',
        created_at: new Date().toISOString()
    };
    universes.push(newUniverse);
    res.status(201).json(newUniverse);
});

app.get('/api/universes/', (req, res) => {
    res.status(200).json(universes);
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
