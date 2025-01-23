import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { analyticsReducer } from '../../analyticsSlice';
import Dashboard from '../Dashboard';

const mockAnalytics = {
  totalViews: 1000,
  activeParticipants: 500,
  avgSessionDuration: 300,
  engagementRate: 0.75,
  trends: {
    views: 5,
    participants: 10,
    sessionDuration: -2,
    engagement: 3,
  },
  demographics: {
    'Age 18-24': 30,
    'Age 25-34': 45,
    'Age 35-44': 25,
  },
  features: [
    { name: 'Feature 1', count: 50 },
    { name: 'Feature 2', count: 30 },
  ],
  activityData: [
    { date: '2024-01-01', count: 100 },
    { date: '2024-01-02', count: 150 },
    { date: '2024-01-03', count: 120 },
  ],
  recentActivity: [
    {
      timestamp: '2024-01-01T10:00:00',
      user: 'User 1',
      action: 'Created',
      details: 'New universe',
    },
  ],
  topContributors: [
    { username: 'User 1', contributions: 50, lastActive: '12/31/2023' },
  ],
};

const mockMetrics = {
  totalViews: 100,
  totalUsers: 50,
  averageSessionDuration: 300,
  bounceRate: 50,
};

const mockTimeline = [
  { date: '12/31/2023', views: 50 },
  { date: '12/30/2023', views: 40 },
  { date: '12/29/2023', views: 30 },
];

const renderWithProviders = (
  ui,
  {
    preloadedState = {},
    store = configureStore({
      reducer: { analytics: analyticsReducer },
      preloadedState,
    }),
    ...renderOptions
  } = {}
) => {
  return {
    store,
    ...render(ui, {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      ...renderOptions,
    }),
  };
};

describe('Analytics Dashboard', () => {
  describe('Loading State', () => {
    it('shows loading indicator when loading', () => {
      renderWithProviders(<Dashboard />, {
        preloadedState: {
          analytics: {
            loading: true,
            error: null,
            data: null,
          },
        },
      });

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message and retry button when error occurs', async () => {
      const { store } = renderWithProviders(<Dashboard />, {
        preloadedState: {
          analytics: {
            loading: true,
            error: null,
            data: null,
          },
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      });

      store.dispatch({
        type: 'analytics/fetchAnalytics/rejected',
        payload: 'Failed to load analytics',
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId('loading-indicator')
        ).not.toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(
          screen.getByText('Failed to load analytics')
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /retry/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Charts', () => {
    test('renders demographics chart correctly', async () => {
      renderWithProviders(<Dashboard />, {
        preloadedState: {
          analytics: {
            loading: false,
            error: null,
            data: mockAnalytics,
          },
        },
      });

      await waitFor(() => {
        Object.entries(mockAnalytics.demographics).forEach(([key, value]) => {
          const label = screen.getByTestId(`demographic-label-${key}`);
          expect(label).toBeInTheDocument();
          expect(label).toHaveTextContent(key);

          const valueElement = screen.getByTestId(`demographic-value-${key}`);
          expect(valueElement).toBeInTheDocument();
          expect(valueElement).toHaveTextContent(value.toString());
        });
      });
    });

    test('renders feature usage chart correctly', async () => {
      renderWithProviders(<Dashboard />, {
        preloadedState: {
          analytics: {
            loading: false,
            error: null,
            data: mockAnalytics,
          },
        },
      });

      await waitFor(() => {
        mockAnalytics.features.forEach(feature => {
          const label = screen.getByTestId(`feature-label-${feature.name}`);
          expect(label).toBeInTheDocument();
          expect(label).toHaveTextContent(feature.name);

          const valueElement = screen.getByTestId(
            `feature-value-${feature.name}`
          );
          expect(valueElement).toBeInTheDocument();
          expect(valueElement).toHaveTextContent(feature.count.toString());
        });
      });
    });
  });

  describe('Tables', () => {
    test('renders top contributors table correctly', async () => {
      renderWithProviders(<Dashboard />, {
        preloadedState: {
          analytics: {
            loading: false,
            error: null,
            data: mockAnalytics,
          },
        },
      });

      await waitFor(() => {
        mockAnalytics.topContributors.forEach(contributor => {
          const username = screen.getByTestId(
            `contributor-username-${contributor.username}`
          );
          expect(username).toBeInTheDocument();
          expect(username).toHaveTextContent(contributor.username);

          const count = screen.getByTestId(
            `contributor-count-${contributor.username}`
          );
          expect(count).toBeInTheDocument();
          expect(count).toHaveTextContent(contributor.contributions.toString());

          const date = screen.getByTestId(
            `contributor-date-${contributor.username}`
          );
          expect(date).toBeInTheDocument();
          expect(date).toHaveTextContent(contributor.lastActive);
        });
      });
    });
  });

  describe('State Transitions', () => {
    test('transitions from loading to success state', async () => {
      const { store } = renderWithProviders(<Dashboard />, {
        preloadedState: {
          analytics: {
            loading: true,
            data: null,
            error: null,
          },
        },
      });

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

      store.dispatch({
        type: 'analytics/fetchAnalytics/fulfilled',
        payload: mockAnalytics,
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId('loading-indicator')
        ).not.toBeInTheDocument();
        expect(screen.getByText('Total Views')).toBeInTheDocument();
      });
    });

    test('transitions from loading to error state', async () => {
      const { store } = renderWithProviders(<Dashboard />, {
        preloadedState: {
          analytics: {
            loading: true,
            data: null,
            error: null,
          },
        },
      });

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

      store.dispatch({
        type: 'analytics/fetchAnalytics/rejected',
        payload: 'Failed to load analytics',
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId('loading-indicator')
        ).not.toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });

    test('transitions from error to success state after retry', async () => {
      const { store } = renderWithProviders(<Dashboard />, {
        preloadedState: {
          analytics: {
            loading: true,
            data: null,
            error: null,
          },
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      });

      store.dispatch({
        type: 'analytics/fetchAnalytics/rejected',
        payload: 'Failed to load analytics',
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId('loading-indicator')
        ).not.toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      });

      store.dispatch({
        type: 'analytics/fetchAnalytics/fulfilled',
        payload: mockAnalytics,
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId('loading-indicator')
        ).not.toBeInTheDocument();
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
        expect(screen.getByText('Total Views')).toBeInTheDocument();
      });
    });
  });
});
