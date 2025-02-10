import { rest } from 'msw';
import { mockUser, mockUniverse, mockStoryboard, mockScene, mockVisualEffect, mockAudioTrack } from '../__tests__/fixtures/testData';

const API_BASE_URL = '/api';

export const handlers = [
  // Auth handlers
  rest.post(`${API_BASE_URL}/auth/login`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockUser));
  }),

  rest.post(`${API_BASE_URL}/auth/register`, (req, res, ctx) => {
    return res(ctx.status(201), ctx.json(mockUser));
  }),

  rest.post(`${API_BASE_URL}/auth/logout`, (req, res, ctx) => {
    return res(ctx.status(200));
  }),

  // Universe handlers
  rest.get(`${API_BASE_URL}/universes`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([mockUniverse]));
  }),

  rest.get(`${API_BASE_URL}/universes/:universeId`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockUniverse));
  }),

  rest.post(`${API_BASE_URL}/universes`, (req, res, ctx) => {
    return res(ctx.status(201), ctx.json(mockUniverse));
  }),

  rest.put(`${API_BASE_URL}/universes/:universeId`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockUniverse));
  }),

  rest.delete(`${API_BASE_URL}/universes/:universeId`, (req, res, ctx) => {
    return res(ctx.status(204));
  }),

  // Storyboard handlers
  rest.get(`${API_BASE_URL}/universes/:universeId/storyboards`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([mockStoryboard]));
  }),

  rest.get(`${API_BASE_URL}/storyboards/:storyboardId`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockStoryboard));
  }),

  rest.post(`${API_BASE_URL}/universes/:universeId/storyboards`, (req, res, ctx) => {
    return res(ctx.status(201), ctx.json(mockStoryboard));
  }),

  rest.put(`${API_BASE_URL}/storyboards/:storyboardId`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockStoryboard));
  }),

  rest.delete(`${API_BASE_URL}/storyboards/:storyboardId`, (req, res, ctx) => {
    return res(ctx.status(204));
  }),

  // Scene handlers
  rest.get(`${API_BASE_URL}/storyboards/:storyboardId/scenes`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([mockScene]));
  }),

  rest.get(`${API_BASE_URL}/scenes/:sceneId`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockScene));
  }),

  rest.post(`${API_BASE_URL}/storyboards/:storyboardId/scenes`, (req, res, ctx) => {
    return res(ctx.status(201), ctx.json(mockScene));
  }),

  rest.put(`${API_BASE_URL}/scenes/:sceneId`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockScene));
  }),

  rest.delete(`${API_BASE_URL}/scenes/:sceneId`, (req, res, ctx) => {
    return res(ctx.status(204));
  }),

  rest.put(`${API_BASE_URL}/storyboards/:storyboardId/scenes/reorder`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([mockScene]));
  }),

  // Visual Effect handlers
  rest.get(`${API_BASE_URL}/scenes/:sceneId/visual-effects`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([mockVisualEffect]));
  }),

  rest.post(`${API_BASE_URL}/scenes/:sceneId/visual-effects`, (req, res, ctx) => {
    return res(ctx.status(201), ctx.json(mockVisualEffect));
  }),

  rest.put(`${API_BASE_URL}/visual-effects/:effectId`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockVisualEffect));
  }),

  rest.delete(`${API_BASE_URL}/visual-effects/:effectId`, (req, res, ctx) => {
    return res(ctx.status(204));
  }),

  // Audio Track handlers
  rest.get(`${API_BASE_URL}/scenes/:sceneId/audio-tracks`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([mockAudioTrack]));
  }),

  rest.post(`${API_BASE_URL}/scenes/:sceneId/audio-tracks`, (req, res, ctx) => {
    return res(ctx.status(201), ctx.json(mockAudioTrack));
  }),

  rest.put(`${API_BASE_URL}/audio-tracks/:trackId`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockAudioTrack));
  }),

  rest.delete(`${API_BASE_URL}/audio-tracks/:trackId`, (req, res, ctx) => {
    return res(ctx.status(204));
  }),
];

