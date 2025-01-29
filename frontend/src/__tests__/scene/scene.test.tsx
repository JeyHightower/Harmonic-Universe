import { fireEvent, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { SceneEditor } from '../../components/SceneEditor';
import { server } from '../../mocks/server';
import { ScenePage } from '../../pages/ScenePage';
import { renderWithProviders } from '../../utils/test-utils';

const mockScene = {
  id: 1,
  storyboard_id: 1,
  sequence_number: 1,
  title: 'Test Scene',
  content: 'Test Content',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockVisualEffect = {
  id: 1,
  scene_id: 1,
  effect_type: 'fade',
  start_time: 0,
  duration: 1000,
  parameters: { opacity: 0 },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockAudioTrack = {
  id: 1,
  scene_id: 1,
  track_type: 'background',
  audio_url: 'https://example.com/audio.mp3',
  start_time: 0,
  duration: 1000,
  volume: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('Scene', () => {
  describe('Scene Page', () => {
    beforeEach(() => {
      server.use(
        rest.get('/api/scenes/:sceneId', (req, res, ctx) => {
          return res(ctx.json(mockScene));
        })
      );
    });

    it('displays scene details', async () => {
      renderWithProviders(<ScenePage />);

      await waitFor(() => {
        expect(screen.getByText(mockScene.title)).toBeInTheDocument();
        expect(screen.getByText(mockScene.content)).toBeInTheDocument();
      });
    });

    it('handles scene not found', async () => {
      server.use(
        rest.get('/api/scenes/:sceneId', (req, res, ctx) => {
          return res(ctx.status(404));
        })
      );

      renderWithProviders(<ScenePage />);

      await waitFor(() => {
        expect(screen.getByText(/scene not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Scene Editor', () => {
    beforeEach(() => {
      server.use(
        rest.get('/api/scenes/:sceneId/visual-effects', (req, res, ctx) => {
          return res(ctx.json([mockVisualEffect]));
        }),
        rest.get('/api/scenes/:sceneId/audio-tracks', (req, res, ctx) => {
          return res(ctx.json([mockAudioTrack]));
        })
      );
    });

    it('displays visual effects', async () => {
      renderWithProviders(<SceneEditor sceneId={1} />);

      await waitFor(() => {
        expect(screen.getByText(/fade/i)).toBeInTheDocument();
      });
    });

    it('displays audio tracks', async () => {
      renderWithProviders(<SceneEditor sceneId={1} />);

      await waitFor(() => {
        expect(screen.getByText(/background/i)).toBeInTheDocument();
      });
    });

    it('creates a new visual effect', async () => {
      server.use(
        rest.post('/api/scenes/:sceneId/visual-effects', (req, res, ctx) => {
          return res(ctx.json(mockVisualEffect));
        })
      );

      renderWithProviders(<SceneEditor sceneId={1} />);

      fireEvent.click(screen.getByText(/add visual effect/i));
      fireEvent.change(screen.getByLabelText(/effect type/i), {
        target: { value: 'fade' },
      });
      fireEvent.click(screen.getByText(/save/i));

      await waitFor(() => {
        expect(screen.getByText(/fade/i)).toBeInTheDocument();
      });
    });

    it('creates a new audio track', async () => {
      server.use(
        rest.post('/api/scenes/:sceneId/audio-tracks', (req, res, ctx) => {
          return res(ctx.json(mockAudioTrack));
        })
      );

      renderWithProviders(<SceneEditor sceneId={1} />);

      fireEvent.click(screen.getByText(/add audio track/i));
      fireEvent.change(screen.getByLabelText(/track type/i), {
        target: { value: 'background' },
      });
      fireEvent.click(screen.getByText(/save/i));

      await waitFor(() => {
        expect(screen.getByText(/background/i)).toBeInTheDocument();
      });
    });

    it('updates a visual effect', async () => {
      const updatedEffect = {
        ...mockVisualEffect,
        effect_type: 'slide',
      };

      server.use(
        rest.put('/api/visual-effects/:effectId', (req, res, ctx) => {
          return res(ctx.json(updatedEffect));
        })
      );

      renderWithProviders(<SceneEditor sceneId={1} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText(/fade/i));
      });

      fireEvent.change(screen.getByLabelText(/effect type/i), {
        target: { value: 'slide' },
      });
      fireEvent.click(screen.getByText(/save/i));

      await waitFor(() => {
        expect(screen.getByText(/slide/i)).toBeInTheDocument();
      });
    });

    it('updates an audio track', async () => {
      const updatedTrack = {
        ...mockAudioTrack,
        track_type: 'voice',
      };

      server.use(
        rest.put('/api/audio-tracks/:trackId', (req, res, ctx) => {
          return res(ctx.json(updatedTrack));
        })
      );

      renderWithProviders(<SceneEditor sceneId={1} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText(/background/i));
      });

      fireEvent.change(screen.getByLabelText(/track type/i), {
        target: { value: 'voice' },
      });
      fireEvent.click(screen.getByText(/save/i));

      await waitFor(() => {
        expect(screen.getByText(/voice/i)).toBeInTheDocument();
      });
    });

    it('deletes a visual effect', async () => {
      server.use(
        rest.delete('/api/visual-effects/:effectId', (req, res, ctx) => {
          return res(ctx.status(204));
        })
      );

      renderWithProviders(<SceneEditor sceneId={1} />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('delete-visual-effect'));
      });

      await waitFor(() => {
        expect(screen.queryByText(/fade/i)).not.toBeInTheDocument();
      });
    });

    it('deletes an audio track', async () => {
      server.use(
        rest.delete('/api/audio-tracks/:trackId', (req, res, ctx) => {
          return res(ctx.status(204));
        })
      );

      renderWithProviders(<SceneEditor sceneId={1} />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('delete-audio-track'));
      });

      await waitFor(() => {
        expect(screen.queryByText(/background/i)).not.toBeInTheDocument();
      });
    });
  });
});

