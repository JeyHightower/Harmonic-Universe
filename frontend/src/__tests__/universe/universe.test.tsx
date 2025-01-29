import { fireEvent, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { server } from '../../mocks/server';
import { render } from '../../test-utils';
import { UniverseListPage } from '../../pages/UniverseListPage';
import { UniverseDetailsPage } from '../../pages/UniverseDetailsPage';

const mockUniverse = {
  id: 1,
  user_id: 1,
  title: 'Test Universe',
  description: 'Test Description',
  is_public: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('Universe', () => {
  describe('Universe List', () => {
    it('should display list of universes', async () => {
      render(<UniverseListPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Universe')).toBeInTheDocument();
      });
    });

    it('should create new universe', async () => {
      render(<UniverseListPage />);

      fireEvent.click(screen.getByRole('button', { name: /create universe/i }));

      fireEvent.change(screen.getByLabelText(/title/i), {
        target: { value: 'New Universe' },
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'New Description' },
      });

      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText('New Universe')).toBeInTheDocument();
      });
    });

    it('should handle creation errors', async () => {
      server.use(
        rest.post('/api/universes', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({ error: 'Title is required' })
          );
        })
      );

      render(<UniverseListPage />);

      fireEvent.click(screen.getByRole('button', { name: /create universe/i }));
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });
    });
  });

  describe('Universe Details', () => {
    beforeEach(() => {
      server.use(
        rest.get('/api/universes/:universeId', (req, res, ctx) => {
          return res(ctx.status(200), ctx.json(mockUniverse));
        })
      );
    });

    it('should display universe details', async () => {
      render(<UniverseDetailsPage />, {
        preloadedState: {
          universe: {
            currentUniverse: mockUniverse,
            universes: [mockUniverse],
            isLoading: false,
            error: null,
          },
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Test Universe')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
      });
    });

    it('should update universe details', async () => {
      render(<UniverseDetailsPage />, {
        preloadedState: {
          universe: {
            currentUniverse: mockUniverse,
            universes: [mockUniverse],
            isLoading: false,
            error: null,
          },
        },
      });

      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      fireEvent.change(screen.getByLabelText(/title/i), {
        target: { value: 'Updated Universe' },
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Updated Description' },
      });

      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText('Updated Universe')).toBeInTheDocument();
        expect(screen.getByText('Updated Description')).toBeInTheDocument();
      });
    });

    it('should handle update errors', async () => {
      server.use(
        rest.put('/api/universes/:universeId', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({ error: 'Title cannot be empty' })
          );
        })
      );

      render(<UniverseDetailsPage />, {
        preloadedState: {
          universe: {
            currentUniverse: mockUniverse,
            universes: [mockUniverse],
            isLoading: false,
            error: null,
          },
        },
      });

      fireEvent.click(screen.getByRole('button', { name: /edit/i }));
      fireEvent.change(screen.getByLabelText(/title/i), {
        target: { value: '' },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText('Title cannot be empty')).toBeInTheDocument();
      });
    });

    it('should delete universe', async () => {
      render(<UniverseDetailsPage />, {
        preloadedState: {
          universe: {
            currentUniverse: mockUniverse,
            universes: [mockUniverse],
            isLoading: false,
            error: null,
          },
        },
      });

      fireEvent.click(screen.getByRole('button', { name: /delete/i }));
      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

      await waitFor(() => {
        expect(screen.queryByText('Test Universe')).not.toBeInTheDocument();
      });
    });
  });
});


