import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import UniverseCreate from '../../components/Universe/UniverseCreate';
import UniverseDetails from '../../components/Universe/UniverseDetails';
import UniverseList from '../../components/Universe/UniverseList';
import {
  mockAuthState,
  mockUniverseState,
  renderWithProviders,
} from '../setup/test-utils';

const server = setupServer(
  rest.get('/api/universes', (req, res, ctx) => {
    return res(ctx.json(mockUniverseState.universe.universes));
  }),
  rest.get('/api/universes/:id', (req, res, ctx) => {
    return res(ctx.json(mockUniverseState.universe.universes[0]));
  }),
  rest.post('/api/universes', (req, res, ctx) => {
    return res(ctx.json({ ...mockUniverseState.universe.universes[0], id: 2 }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Universe Management', () => {
  describe('Universe List', () => {
    it('should render universe list', async () => {
      renderWithProviders(<UniverseList />, {
        preloadedState: { ...mockUniverseState, ...mockAuthState },
      });

      await waitFor(() => {
        expect(screen.getByText('Test Universe')).toBeInTheDocument();
      });
    });

    it('should handle empty universe list', async () => {
      server.use(
        rest.get('/api/universes', (req, res, ctx) => {
          return res(ctx.json([]));
        })
      );

      renderWithProviders(<UniverseList />, {
        preloadedState: { ...mockAuthState },
      });

      await waitFor(() => {
        expect(screen.getByText(/no universes found/i)).toBeInTheDocument();
      });
    });

    it('should handle loading state', () => {
      renderWithProviders(<UniverseList />, {
        preloadedState: {
          universe: { ...mockUniverseState.universe, loading: true },
        },
      });

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Universe Details', () => {
    it('should render universe details', async () => {
      renderWithProviders(<UniverseDetails />, {
        preloadedState: {
          universe: {
            ...mockUniverseState.universe,
            currentUniverse: mockUniverseState.universe.universes[0],
          },
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Test Universe')).toBeInTheDocument();
        expect(screen.getByText(/a test universe/i)).toBeInTheDocument();
      });
    });

    it('should handle universe not found', async () => {
      server.use(
        rest.get('/api/universes/:id', (req, res, ctx) => {
          return res(ctx.status(404));
        })
      );

      renderWithProviders(<UniverseDetails />);

      await waitFor(() => {
        expect(screen.getByText(/universe not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Universe Creation', () => {
    it('should render creation form', () => {
      renderWithProviders(<UniverseCreate />, {
        preloadedState: { ...mockAuthState },
      });

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /create/i })
      ).toBeInTheDocument();
    });

    it('should handle successful universe creation', async () => {
      renderWithProviders(<UniverseCreate />, {
        preloadedState: { ...mockAuthState },
      });

      await userEvent.type(screen.getByLabelText(/name/i), 'New Universe');
      await userEvent.type(
        screen.getByLabelText(/description/i),
        'A new test universe'
      );
      await userEvent.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(
          screen.queryByText(/error creating universe/i)
        ).not.toBeInTheDocument();
      });
    });

    it('should handle creation error', async () => {
      server.use(
        rest.post('/api/universes', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({ message: 'Error creating universe' })
          );
        })
      );

      renderWithProviders(<UniverseCreate />, {
        preloadedState: { ...mockAuthState },
      });

      await userEvent.type(screen.getByLabelText(/name/i), 'New Universe');
      await userEvent.type(
        screen.getByLabelText(/description/i),
        'A new test universe'
      );
      await userEvent.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/error creating universe/i)
        ).toBeInTheDocument();
      });
    });
  });
});
