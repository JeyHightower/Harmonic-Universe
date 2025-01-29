import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const { username, password } = await request.json();

    if (username === 'testuser' && password === 'password123') {
      return HttpResponse.json({
        access_token: 'fake-jwt-token',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
        },
      });
    }

    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const { username, email, password } = await request.json();

    return HttpResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: 1,
          username,
          email,
        },
      },
      { status: 201 }
    );
  }),

  // User endpoints
  http.get('/api/user/profile', ({ request }) => {
    const auth = request.headers.get('Authorization');

    if (!auth || !auth.startsWith('Bearer ')) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    return HttpResponse.json({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
    });
  }),

  // Universe endpoints
  http.get('/api/universes', () => {
    return HttpResponse.json({
      universes: [
        {
          id: 1,
          name: 'Test Universe',
          description: 'A test universe',
        },
      ],
    });
  }),

  // Storyboard endpoints
  http.get('/api/universes/:universeId/storyboards', ({ params }) => {
    return HttpResponse.json({
      storyboards: [
        {
          id: 1,
          title: 'Test Storyboard',
          description: 'A test storyboard',
          universeId: parseInt(params.universeId),
        },
      ],
    });
  }),

  http.post(
    '/api/universes/:universeId/storyboards',
    async ({ request, params }) => {
      const { title, description } = await request.json();

      return HttpResponse.json(
        {
          id: 1,
          title,
          description,
          universeId: parseInt(params.universeId),
        },
        { status: 201 }
      );
    }
  ),
];
