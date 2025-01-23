import { rest } from 'msw';

const API_URL = 'http://localhost:5000/api';

export const handlers = [
  // Auth endpoints
  rest.post(`${API_URL}/auth/register`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        token: 'fake-jwt-token',
        user: {
          id: 1,
          username: req.body.username,
          email: req.body.email,
        },
      })
    );
  }),

  rest.post(`${API_URL}/auth/login`, (req, res, ctx) => {
    if (req.body.email === 'invalid@example.com') {
      return res(ctx.status(401), ctx.json({ message: 'Invalid credentials' }));
    }
    return res(
      ctx.status(200),
      ctx.json({
        token: 'fake-jwt-token',
        user: {
          id: 1,
          username: 'testuser',
          email: req.body.email,
        },
      })
    );
  }),

  // Universe endpoints
  rest.get(`${API_URL}/universes`, (req, res, ctx) => {
    const filter = req.url.searchParams.get('filter');
    const universes = [
      {
        id: 1,
        name: 'Test Universe',
        description: 'A test universe',
        is_public: true,
        creator_id: 1,
      },
    ];
    if (filter === 'favorites') {
      return res(ctx.json(universes.filter(u => u.isFavorite)));
    }
    return res(ctx.json(universes));
  }),

  rest.post(`${API_URL}/universes`, (req, res, ctx) => {
    if (!req.body.name) {
      return res(ctx.status(400), ctx.json({ message: 'Name is required' }));
    }
    return res(
      ctx.status(201),
      ctx.json({
        id: 1,
        name: req.body.name,
        description: req.body.description,
        is_public: req.body.is_public,
        creator_id: 1,
      })
    );
  }),

  rest.get(`${API_URL}/universes/:id`, (req, res, ctx) => {
    if (req.params.id === '999') {
      return res(ctx.status(404), ctx.json({ message: 'Universe not found' }));
    }
    return res(
      ctx.json({
        id: req.params.id,
        name: 'Test Universe',
        description: 'A test universe',
        is_public: true,
        creator_id: 1,
        physics_parameters: { gravity: 9.81 },
      })
    );
  }),

  rest.put(`${API_URL}/universes/:id`, (req, res, ctx) => {
    return res(
      ctx.json({
        id: req.params.id,
        ...req.body,
      })
    );
  }),

  // Parameters endpoints
  rest.put(`${API_URL}/universes/:id/parameters/:type`, (req, res, ctx) => {
    return res(
      ctx.json({
        id: req.params.id,
        [`${req.params.type}_parameters`]: req.body.parameters,
      })
    );
  }),

  // Privacy endpoints
  rest.put(`${API_URL}/universes/:id/privacy`, (req, res, ctx) => {
    return res(
      ctx.json({
        id: req.params.id,
        ...req.body,
      })
    );
  }),

  // Favorites endpoints
  rest.post(`${API_URL}/universes/:id/favorite`, (req, res, ctx) => {
    return res(
      ctx.json({
        id: req.params.id,
        isFavorite: true,
      })
    );
  }),

  // Profile endpoints
  rest.put(`${API_URL}/profile`, (req, res, ctx) => {
    return res(
      ctx.json({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        bio: req.body.bio,
      })
    );
  }),

  // Collaboration endpoints
  rest.post(`${API_URL}/universes/:id/share`, (req, res, ctx) => {
    return res(
      ctx.json({
        id: req.params.id,
        collaborators: [
          {
            id: 2,
            username: 'collaborator',
            email: req.body.email,
          },
        ],
      })
    );
  }),
];
