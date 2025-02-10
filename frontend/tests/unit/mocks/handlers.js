import { rest } from 'msw'

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'

export const handlers = [
  // Universe handlers
  rest.get(`${API_URL}/universes`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        universes: [
          {
            id: 1,
            name: 'Test Universe',
            description: 'A test universe',
            user_id: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      })
    )
  }),

  // Storyboard handlers
  rest.get(`${API_URL}/universes/:universeId/storyboards`, (req, res, ctx) => {
    const { universeId } = req.params
    return res(
      ctx.status(200),
      ctx.json({
        storyboards: [
          {
            id: 1,
            name: 'Test Storyboard',
            description: 'A test storyboard',
            universe_id: parseInt(universeId),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      })
    )
  }),

  // Scene handlers
  rest.get(`${API_URL}/universes/:universeId/storyboards/:storyboardId/scenes`, (req, res, ctx) => {
    const { storyboardId } = req.params
    return res(
      ctx.status(200),
      ctx.json({
        scenes: [
          {
            id: 1,
            name: 'Test Scene',
            description: 'A test scene',
            sequence: 0,
            content: { layout: 'grid', elements: [] },
            storyboard_id: parseInt(storyboardId),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      })
    )
  }),

  // Media effects handlers
  rest.get(`${API_URL}/universes/:universeId/storyboards/:storyboardId/scenes/:sceneId/visual-effects`, (req, res, ctx) => {
    const { sceneId } = req.params
    return res(
      ctx.status(200),
      ctx.json({
        visual_effects: [
          {
            id: 1,
            name: 'Test Effect',
            effect_type: 'particle',
            parameters: { speed: 1.0, size: 2.0 },
            scene_id: parseInt(sceneId),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      })
    )
  }),

  rest.get(`${API_URL}/universes/:universeId/storyboards/:storyboardId/scenes/:sceneId/audio-tracks`, (req, res, ctx) => {
    const { sceneId } = req.params
    return res(
      ctx.status(200),
      ctx.json({
        audio_tracks: [
          {
            id: 1,
            name: 'Test Track',
            track_type: 'background',
            file_path: 'audio/test.mp3',
            parameters: { volume: 0.8, loop: true },
            scene_id: parseInt(sceneId),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      })
    )
  }),

  // Auth handlers
  rest.post(`${API_URL}/auth/login`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        access_token: 'test_token',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com'
        }
      })
    )
  }),

  rest.post(`${API_URL}/auth/register`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        message: 'User created successfully',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com'
        }
      })
    )
  })
]
