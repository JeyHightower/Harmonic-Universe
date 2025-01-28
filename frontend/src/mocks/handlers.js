import { rest } from 'msw';

const baseUrl = 'http://localhost:5000/api';

export const handlers = [
  // Auth handlers
  rest.post(`${baseUrl}/auth/register`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        token: 'mock-token',
        user: {
          id: 1,
          username: 'testuser',
          email: req.body.email,
        },
      })
    );
  }),

  rest.post(`${baseUrl}/auth/login`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        token: 'mock-token',
        user: {
          id: 1,
          username: 'testuser',
          email: req.body.email,
        },
      })
    );
  }),

  // Universe handlers
  rest.get(`${baseUrl}/universes`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        universes: [
          {
            id: 1,
            name: 'Test Universe',
            description: 'A test universe',
            physics_parameters: {
              gravity: 9.81,
              time_dilation: 1.0,
            },
            creator_id: 1,
          },
        ],
      })
    );
  }),

  rest.post(`${baseUrl}/universes`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 2,
        name: req.body.name,
        description: req.body.description,
        physics_parameters: req.body.physics_parameters,
        creator_id: 1,
      })
    );
  }),

  // Profile handlers
  rest.get(`${baseUrl}/profile`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 1,
        bio: 'Test bio',
        preferences: {
          theme: 'dark',
          notifications: true,
        },
      })
    );
  }),

  rest.put(`${baseUrl}/profile`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 1,
        bio: req.body.bio,
        preferences: req.body.preferences,
      })
    );
  }),

  // Collaboration handlers
  rest.post(`${baseUrl}/universes/:id/collaborators`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        universe_id: parseInt(req.params.id),
        user_email: req.body.email,
        role: req.body.role,
      })
    );
  }),

  rest.get(`${baseUrl}/universes/:id/collaborators`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        collaborators: [
          {
            id: 2,
            email: 'collaborator@example.com',
            role: 'editor',
          },
        ],
      })
    );
  }),
];
