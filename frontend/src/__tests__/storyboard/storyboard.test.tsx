import { fireEvent, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { server } from '../../mocks/server';
import { StoryboardPage } from '../../pages/StoryboardPage';
import { renderWithProviders } from '../../utils/test-utils';

const mockStoryboard = {
  id: 1,
  universe_id: 1,
  title: 'Test Storyboard',
  description: 'Test Description',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('Storyboard', () => {
  describe('Storyboard Details', () => {
    beforeEach(() => {
      server.use(
        rest.get('/api/storyboards/:storyboardId', (req, res, ctx) => {
          return res(ctx.json(mockStoryboard));
        })
      );
    });

    it('displays storyboard details', async () => {
      renderWithProviders(<StoryboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Storyboard')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
      });
    });

    it('updates storyboard details', async () => {
      server.use(
        rest.put('/api/storyboards/:storyboardId', (req, res, ctx) => {
          return res(
            ctx.json({
              ...mockStoryboard,
              title: 'Updated Storyboard',
              description: 'Updated Description',
            })
          );
        })
      );

      renderWithProviders(<StoryboardPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit'));
      });

      fireEvent.change(screen.getByLabelText('Title'), {
        target: { value: 'Updated Storyboard' },
      });
      fireEvent.change(screen.getByLabelText('Description'), {
        target: { value: 'Updated Description' },
      });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Updated Storyboard')).toBeInTheDocument();
        expect(screen.getByText('Updated Description')).toBeInTheDocument();
      });
    });

    it('handles update errors', async () => {
      server.use(
        rest.put('/api/storyboards/:storyboardId', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json({ error: 'Title is required' }));
        })
      );

      renderWithProviders(<StoryboardPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit'));
      });

      fireEvent.change(screen.getByLabelText('Title'), {
        target: { value: '' },
      });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });
    });

    it('deletes a storyboard', async () => {
      server.use(
        rest.delete('/api/storyboards/:storyboardId', (req, res, ctx) => {
          return res(ctx.status(204));
        })
      );

      renderWithProviders(<StoryboardPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Delete'));
      });

      fireEvent.click(screen.getByText('Confirm'));

      await waitFor(() => {
        expect(screen.queryByText('Test Storyboard')).not.toBeInTheDocument();
      });
    });
  });

  describe('Storyboard List', () => {
    beforeEach(() => {
      server.use(
        rest.get('/api/universes/:universeId/storyboards', (req, res, ctx) => {
          return res(ctx.json([mockStoryboard]));
        })
      );
    });

    it('displays list of storyboards', async () => {
      renderWithProviders(<StoryboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Storyboard')).toBeInTheDocument();
      });
    });

    it('creates a new storyboard', async () => {
      server.use(
        rest.post('/api/universes/:universeId/storyboards', (req, res, ctx) => {
          return res(ctx.json(mockStoryboard));
        })
      );

      renderWithProviders(<StoryboardPage />);

      fireEvent.click(screen.getByText('Add Storyboard'));

      fireEvent.change(screen.getByLabelText('Title'), {
        target: { value: 'New Storyboard' },
      });
      fireEvent.change(screen.getByLabelText('Description'), {
        target: { value: 'New Description' },
      });

      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(screen.getByText('New Storyboard')).toBeInTheDocument();
      });
    });

    it('handles creation errors', async () => {
      server.use(
        rest.post('/api/universes/:universeId/storyboards', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json({ error: 'Title is required' }));
        })
      );

      renderWithProviders(<StoryboardPage />);

      fireEvent.click(screen.getByText('Add Storyboard'));
      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });
    });
  });
});
