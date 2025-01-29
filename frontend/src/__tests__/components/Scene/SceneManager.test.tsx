import { fireEvent, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { SceneManager } from '../../../components/Scene/SceneManager';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../utils/test-utils';
import { mockAudioTrack, mockScene, mockVisualEffect } from '../../fixtures/testData';

describe('SceneManager', () => {
  const defaultProps = {
    universeId: 1,
    storyboardId: 1,
    sceneId: 1,
  };

  beforeEach(() => {
    server.use(
      rest.get('/api/scenes/:sceneId', (req, res, ctx) => {
        return res(ctx.json(mockScene));
      }),
      rest.get('/api/scenes/:sceneId/visual-effects', (req, res, ctx) => {
        return res(ctx.json([mockVisualEffect]));
      }),
      rest.get('/api/scenes/:sceneId/audio-tracks', (req, res, ctx) => {
        return res(ctx.json([mockAudioTrack]));
      })
    );
  });

  it('renders scene manager with effects and audio tracks', async () => {
    renderWithProviders(<SceneManager {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(mockScene.title)).toBeInTheDocument();
      expect(screen.getByText(mockVisualEffect.name)).toBeInTheDocument();
      expect(screen.getByText(mockAudioTrack.name)).toBeInTheDocument();
    });
  });

  it('opens add visual effect dialog', async () => {
    renderWithProviders(<SceneManager {...defaultProps} />);

    fireEvent.click(screen.getByText('Add Visual Effect'));

    await waitFor(() => {
      expect(screen.getByText('Create Visual Effect')).toBeInTheDocument();
      expect(screen.getByLabelText('Effect Name')).toBeInTheDocument();
    });
  });

  it('creates a new visual effect', async () => {
    const newEffect = { ...mockVisualEffect, id: 2, name: 'New Effect' };
    server.use(
      rest.post('/api/scenes/:sceneId/visual-effects', (req, res, ctx) => {
        return res(ctx.status(201), ctx.json(newEffect));
      })
    );

    renderWithProviders(<SceneManager {...defaultProps} />);

    // Open create dialog
    fireEvent.click(screen.getByText('Add Visual Effect'));

    // Fill in form
    fireEvent.change(screen.getByLabelText('Effect Name'), {
      target: { value: 'New Effect' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('New Effect')).toBeInTheDocument();
    });
  });

  it('opens add audio track dialog', async () => {
    renderWithProviders(<SceneManager {...defaultProps} />);

    fireEvent.click(screen.getByText('Add Audio Track'));

    await waitFor(() => {
      expect(screen.getByText('Create Audio Track')).toBeInTheDocument();
      expect(screen.getByLabelText('Track Name')).toBeInTheDocument();
    });
  });

  it('creates a new audio track', async () => {
    const newTrack = { ...mockAudioTrack, id: 2, name: 'New Track' };
    server.use(
      rest.post('/api/scenes/:sceneId/audio-tracks', (req, res, ctx) => {
        return res(ctx.status(201), ctx.json(newTrack));
      })
    );

    renderWithProviders(<SceneManager {...defaultProps} />);

    // Open create dialog
    fireEvent.click(screen.getByText('Add Audio Track'));

    // Fill in form
    fireEvent.change(screen.getByLabelText('Track Name'), {
      target: { value: 'New Track' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('New Track')).toBeInTheDocument();
    });
  });

  it('updates visual effect properties', async () => {
    const updatedEffect = { ...mockVisualEffect, name: 'Updated Effect' };
    server.use(
      rest.put('/api/visual-effects/:effectId', (req, res, ctx) => {
        return res(ctx.json(updatedEffect));
      })
    );

    renderWithProviders(<SceneManager {...defaultProps} />);

    // Wait for effect to load
    await waitFor(() => {
      expect(screen.getByText(mockVisualEffect.name)).toBeInTheDocument();
    });

    // Click edit button
    fireEvent.click(screen.getByLabelText('Edit Effect'));

    // Update name
    fireEvent.change(screen.getByLabelText('Effect Name'), {
      target: { value: 'Updated Effect' },
    });

    // Save changes
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Updated Effect')).toBeInTheDocument();
    });
  });

  it('updates audio track properties', async () => {
    const updatedTrack = { ...mockAudioTrack, name: 'Updated Track' };
    server.use(
      rest.put('/api/audio-tracks/:trackId', (req, res, ctx) => {
        return res(ctx.json(updatedTrack));
      })
    );

    renderWithProviders(<SceneManager {...defaultProps} />);

    // Wait for track to load
    await waitFor(() => {
      expect(screen.getByText(mockAudioTrack.name)).toBeInTheDocument();
    });

    // Click edit button
    fireEvent.click(screen.getByLabelText('Edit Track'));

    // Update name
    fireEvent.change(screen.getByLabelText('Track Name'), {
      target: { value: 'Updated Track' },
    });

    // Save changes
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Updated Track')).toBeInTheDocument();
    });
  });

  it('deletes a visual effect', async () => {
    server.use(
      rest.delete('/api/visual-effects/:effectId', (req, res, ctx) => {
        return res(ctx.status(204));
      })
    );

    renderWithProviders(<SceneManager {...defaultProps} />);

    // Wait for effect to load
    await waitFor(() => {
      expect(screen.getByText(mockVisualEffect.name)).toBeInTheDocument();
    });

    // Click delete button
    fireEvent.click(screen.getByLabelText('Delete Effect'));

    // Confirm deletion
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(screen.queryByText(mockVisualEffect.name)).not.toBeInTheDocument();
    });
  });

  it('deletes an audio track', async () => {
    server.use(
      rest.delete('/api/audio-tracks/:trackId', (req, res, ctx) => {
        return res(ctx.status(204));
      })
    );

    renderWithProviders(<SceneManager {...defaultProps} />);

    // Wait for track to load
    await waitFor(() => {
      expect(screen.getByText(mockAudioTrack.name)).toBeInTheDocument();
    });

    // Click delete button
    fireEvent.click(screen.getByLabelText('Delete Track'));

    // Confirm deletion
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(screen.queryByText(mockAudioTrack.name)).not.toBeInTheDocument();
    });
  });

  it('handles errors when creating effects', async () => {
    server.use(
      rest.post('/api/scenes/:sceneId/visual-effects', (req, res, ctx) => {
        return res(ctx.status(400), ctx.json({ error: 'Effect name is required' }));
      })
    );

    renderWithProviders(<SceneManager {...defaultProps} />);

    // Open create dialog
    fireEvent.click(screen.getByText('Add Visual Effect'));

    // Submit form without name
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('Effect name is required')).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    server.use(
      rest.get('/api/scenes/:sceneId', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    renderWithProviders(<SceneManager {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/error loading scene/i)).toBeInTheDocument();
    });
  });
});
