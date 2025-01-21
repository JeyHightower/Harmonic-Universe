import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Dashboard from '../Dashboard';

describe('Dashboard', () => {
  const mockAnalytics = {
    overview: {
      totalUniverses: 100,
      activeUsers: 50,
      averageEngagement: '30m',
      retentionRate: '75%',
    },
    userMetrics: {
      daily: [
        /* daily data */
      ],
      weekly: [
        /* weekly data */
      ],
      monthly: [
        /* monthly data */
      ],
    },
    universeMetrics: {
      mostActive: [
        { id: 1, name: 'Universe 1', activity: 100 },
        { id: 2, name: 'Universe 2', activity: 80 },
      ],
      recentlyCreated: [
        { id: 3, name: 'Universe 3', created: '2024-02-01' },
        { id: 4, name: 'Universe 4', created: '2024-01-31' },
      ],
    },
  };

  const renderWithRedux = (ui, initialState = {}) => {
    const store = configureStore({
      reducer: {
        universe: (state = initialState, action) => {
          if (action.type === 'universe/setAnalytics') {
            return { ...state, analytics: action.payload };
          }
          return state;
        },
      },
    });

    return {
      ...render(
        <Provider store={store}>
          <BrowserRouter>{ui}</BrowserRouter>
        </Provider>
      ),
      store,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Initial Rendering', () => {
    it('shows loading state initially', () => {
      renderWithRedux(<Dashboard />);
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('displays error message when fetch fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed to fetch'));
      renderWithRedux(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(
          'Failed to fetch'
        );
      });
    });
  });

  describe('Data Display', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAnalytics),
      });
    });

    it('displays overview metrics correctly', async () => {
      renderWithRedux(<Dashboard />);

      await waitFor(() => {
        expect(
          screen.getByText(
            `Total Universes: ${mockAnalytics.overview.totalUniverses}`
          )
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            `Active Users: ${mockAnalytics.overview.activeUsers}`
          )
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            `Average Engagement: ${mockAnalytics.overview.averageEngagement}`
          )
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            `Retention Rate: ${mockAnalytics.overview.retentionRate}`
          )
        ).toBeInTheDocument();
      });
    });

    it('displays most active universes', async () => {
      renderWithRedux(<Dashboard />);

      await waitFor(() => {
        mockAnalytics.universeMetrics.mostActive.forEach(universe => {
          expect(screen.getByText(universe.name)).toBeInTheDocument();
          expect(
            screen.getByText(`Activity: ${universe.activity}`)
          ).toBeInTheDocument();
        });
      });
    });

    it('displays recently created universes', async () => {
      renderWithRedux(<Dashboard />);

      await waitFor(() => {
        mockAnalytics.universeMetrics.recentlyCreated.forEach(universe => {
          expect(screen.getByText(universe.name)).toBeInTheDocument();
          expect(screen.getByText(universe.created)).toBeInTheDocument();
        });
      });
    });
  });

  describe('User Interactions', () => {
    it('handles time period changes', async () => {
      const user = userEvent.setup();
      renderWithRedux(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('time-period-select')).toBeInTheDocument();
      });

      await user.selectOptions(
        screen.getByTestId('time-period-select'),
        'weekly'
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('period=weekly')
      );
    });

    it('handles data export', async () => {
      const user = userEvent.setup();
      renderWithRedux(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('export-button')).toBeInTheDocument();
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        blob: () => new Blob(['test data'], { type: 'text/csv' }),
      });

      await user.click(screen.getByTestId('export-button'));
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/analytics/export',
        expect.any(Object)
      );
    });

    it('handles refresh data', async () => {
      const user = userEvent.setup();
      renderWithRedux(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('refresh-button'));
      expect(global.fetch).toHaveBeenCalledTimes(2); // Initial load + refresh
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      renderWithRedux(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(
          'Network error'
        );
        expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      });
    });

    it('handles API errors with status codes', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });
      renderWithRedux(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('403');
        expect(screen.getByTestId('error-message')).toHaveTextContent(
          'Forbidden'
        );
      });
    });

    it('allows retry after error', async () => {
      const user = userEvent.setup();
      global.fetch
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAnalytics),
        });

      renderWithRedux(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('retry-button'));

      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
        expect(
          screen.getByText(
            `Total Universes: ${mockAnalytics.overview.totalUniverses}`
          )
        ).toBeInTheDocument();
      });
    });
  });
});
