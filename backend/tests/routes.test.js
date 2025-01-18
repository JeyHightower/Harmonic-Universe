const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/user');
const Project = require('../models/project');
const { generateToken } = require('../utils/auth');

describe('API Routes', () => {
  let token;
  let userId;
  let projectId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
    await User.deleteMany({});
    await Project.deleteMany({});

    // Create test user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    userId = user._id;
    token = generateToken(user);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Auth Routes', () => {
    test('POST /api/auth/register - creates new user', async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('username', 'newuser');
    });

    test('POST /api/auth/login - authenticates user', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
    });

    test('GET /api/auth/me - gets current user', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', 'test@example.com');
    });
  });

  describe('Project Routes', () => {
    test('POST /api/projects - creates new project', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Project',
          description: 'Test Description',
          tracks: [
            {
              name: 'Track 1',
              notes: [
                {
                  pitch: 60,
                  startTime: 0,
                  duration: 0.5,
                  velocity: 0.8,
                },
              ],
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('title', 'Test Project');
      projectId = res.body._id;
    });

    test('GET /api/projects - gets user projects', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('title', 'Test Project');
    });

    test('GET /api/projects/:id - gets specific project', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('_id', projectId);
    });

    test('PUT /api/projects/:id - updates project', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Project',
          tracks: [
            {
              name: 'Updated Track',
              notes: [
                {
                  pitch: 64,
                  startTime: 0,
                  duration: 0.5,
                  velocity: 0.8,
                },
              ],
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('title', 'Updated Project');
    });

    test('DELETE /api/projects/:id - deletes project', async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      const checkRes = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(checkRes.status).toBe(404);
    });
  });

  describe('Preset Routes', () => {
    let presetId;

    test('POST /api/presets - creates new preset', async () => {
      const res = await request(app)
        .post('/api/presets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Preset',
          parameters: {
            attack: 0.1,
            decay: 0.2,
            sustain: 0.3,
            release: 0.4,
          },
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('name', 'Test Preset');
      presetId = res.body._id;
    });

    test('GET /api/presets - gets user presets', async () => {
      const res = await request(app)
        .get('/api/presets')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('name', 'Test Preset');
    });

    test('PUT /api/presets/:id - updates preset', async () => {
      const res = await request(app)
        .put(`/api/presets/${presetId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Preset',
          parameters: {
            attack: 0.2,
            decay: 0.3,
            sustain: 0.4,
            release: 0.5,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Updated Preset');
    });

    test('DELETE /api/presets/:id - deletes preset', async () => {
      const res = await request(app)
        .delete(`/api/presets/${presetId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      const checkRes = await request(app)
        .get(`/api/presets/${presetId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(checkRes.status).toBe(404);
    });
  });

  describe('Error Handling', () => {
    test('handles invalid token', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });

    test('handles missing token', async () => {
      const res = await request(app).get('/api/projects');
      expect(res.status).toBe(401);
    });

    test('handles invalid project ID', async () => {
      const res = await request(app)
        .get('/api/projects/invalid-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    test('handles unauthorized access', async () => {
      const otherUser = await User.create({
        username: 'other',
        email: 'other@example.com',
        password: 'password123',
      });
      const otherToken = generateToken(otherUser);

      const project = await Project.create({
        title: 'Private Project',
        user: userId,
      });

      const res = await request(app)
        .get(`/api/projects/${project._id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Validation', () => {
    test('validates project creation', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          // Missing required fields
        });

      expect(res.status).toBe(400);
    });

    test('validates preset creation', async () => {
      const res = await request(app)
        .post('/api/presets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          // Missing required fields
        });

      expect(res.status).toBe(400);
    });

    test('validates user registration', async () => {
      const res = await request(app).post('/api/auth/register').send({
        // Missing required fields
      });

      expect(res.status).toBe(400);
    });
  });
});
