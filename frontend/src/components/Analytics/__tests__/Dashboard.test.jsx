import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analyticsService } from '../../../services/analyticsService.js';
import { analyticsReducer } from '../../../store/slices/analyticsSlice.js';
import Dashboard from '../Dashboard.js';

// Mock the analytics service
vi.mock('../../../services/analyticsService', () => ({
  analyticsService: {
    getAnalytics: vi.fn().mockResolvedValue({}),
    exportAnalytics: vi.fn().mockResolvedValue({}),
    getMetrics: vi.fn().mockResolvedValue({}),
    getActivityTimeline: vi.fn().mockResolvedValue({}),
  },
}));

const mockAnalytics = {
  totalViews: 1000,
  viewsTrend: 5,
  activeParticipants: 50,
  participantsTrend: 10,
  avgSessionDuration: 300,
  durationTrend: -2,
  engagementRate: 0.75,
  engagementTrend: 3,
  activityData: [
    { date: '2024-01-01', value: 100 },
    { date: '2024-01-02', value: 120 },
  ],
  maxActivity: 120,
  demographics: {
    'Age 18-24': 30,
    'Age 25-34': 45,
    'Age 35-44': 25,
  },
  totalParticipants: 100,
  featureUsage: [
    { name: 'Feature 1', count: 50 },
    { name: 'Feature 2', count: 30 },
  ],
  maxFeatureUsage: 50,
  recentActivity: [
    {
      id: 1,
      timestamp: '2024-01-01T10:00:00',
      user: 'User 1',
      action: 'Created',
      details: 'New universe',
    },
  ],
  topContributors: [
    {
      id: 1,
      username: 'User 1',
      contributions: 50,
      lastActive: '2024-01-01',
    },
  ],
};

const mockMetrics = {
  totalViews: mockAnalytics.totalViews,
  viewsTrend: mockAnalytics.viewsTrend,
  activeParticipants: mockAnalytics.activeParticipants,
  participantsTrend: mockAnalytics.participantsTrend,
  avgSessionDuration: mockAnalytics.avgSessionDuration,
  durationTrend: mockAnalytics.durationTrend,
  engagementRate: mockAnalytics.engagementRate,
  engagementTrend: mockAnalytics.engagementTrend,
};

const mockTimeline = {
  activityData: mockAnalytics.activityData,
  maxActivity: mockAnalytics.maxActivity,
};

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      analytics: analyticsReducer,
    },
    preloadedState: {
      analytics: {
        data: null,
        metrics: null,
        timeline: null,
        loading: false,
        error: null,
        export: {
          loading: false,
          error: null,
          success: false,
        },
        ...initialState,
      },
    },
  });
};

const renderWithProviders = async ({
  preloadedState = {},
  store = createTestStore(preloadedState),
  initialPath = '/analytics/1',
  ...renderOptions
} = {}) => {
  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/analytics/:id" element={children} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );

  const rendered = render(<Dashboard />, {
    wrapper: Wrapper,
    ...renderOptions,
  });

  // Wait for initial data fetch
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  return {
    store,
    ...rendered,
  };
};

describe('Analytics Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    analyticsService.getAnalytics.mockResolvedValue(mockAnalytics);
    analyticsService.getMetrics.mockResolvedValue(mockMetrics);
    analyticsService.getActivityTimeline.mockResolvedValue(mockTimeline);
  });

  describe('Loading State', () => {
    it('shows loading indicator when loading', async () => {
      // Mock the API calls to be pending
      analyticsService.getAnalytics.mockImplementation(
        () => new Promise(() => {})
      );
      analyticsService.getMetrics.mockImplementation(
        () => new Promise(() => {})
      );
      analyticsService.getActivityTimeline.mockImplementation(
        () => new Promise(() => {})
      );

      await renderWithProviders({
        preloadedState: {
          analytics: {
            loading: true,
            data: null,
            metrics: null,
            timeline: null,
            error: null,
            export: {
              loading: false,
              error: null,
              success: false,
            },
          },
        },
      });

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message and retry button when error occurs', async () => {
      // Mock the API calls to reject
      const errorMessage = 'Failed to load analytics';
      analyticsService.getAnalytics.mockRejectedValue(new Error(errorMessage));
      analyticsService.getMetrics.mockRejectedValue(new Error(errorMessage));
      analyticsService.getActivityTimeline.mockRejectedValue(
        new Error(errorMessage)
      );

      await renderWithProviders({
        preloadedState: {
          analytics: {
            error: errorMessage,
            data: null,
            metrics: null,
            timeline: null,
            loading: false,
            export: {
              loading: false,
              error: null,
              success: false,
            },
          },
        },
      });

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        errorMessage
      );
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('displays overview metrics correctly', async () => {
      await renderWithProviders({
        preloadedState: {
          analytics: {
            data: mockAnalytics,
            metrics: mockMetrics,
            timeline: mockTimeline,
            loading: false,
            error: null,
            export: {
              loading: false,
              error: null,
              success: false,
            },
          },
        },
      });

      const statCards = screen.getAllByTestId('stat-card');
      expect(statCards[0]).toHaveTextContent(mockMetrics.totalViews.toString());
      expect(statCards[1]).toHaveTextContent(
        mockMetrics.activeParticipants.toString()
      );
      expect(statCards[2]).toHaveTextContent(
        `${Math.floor(mockMetrics.avgSessionDuration / 60)}m`
      );
      expect(statCards[3]).toHaveTextContent(
        `${(mockMetrics.engagementRate * 100).toFixed(1)}%`
      );
    });

    it('displays activity chart data', async () => {
      await renderWithProviders({
        preloadedState: {
          analytics: {
            data: mockAnalytics,
            metrics: mockMetrics,
            timeline: mockTimeline,
            loading: false,
            error: null,
            export: {
              loading: false,
              error: null,
              success: false,
            },
          },
        },
      });

      mockTimeline.activityData.forEach(point => {
        const bar = screen.getByTitle(
          `${point.date}: ${point.value} activities`
        );
        expect(bar).toBeInTheDocument();
      });
    });

    it('displays recent activity', async () => {
      await renderWithProviders({
        preloadedState: {
          analytics: {
            data: mockAnalytics,
            metrics: mockMetrics,
            timeline: mockTimeline,
            loading: false,
            error: null,
            export: {
              loading: false,
              error: null,
              success: false,
            },
          },
        },
      });

      const activityTable = screen.getByTestId('activity-table');
      mockAnalytics.recentActivity.forEach(activity => {
        expect(
          within(activityTable).getByText(activity.user)
        ).toBeInTheDocument();
        expect(
          within(activityTable).getByText(activity.action)
        ).toBeInTheDocument();
        expect(
          within(activityTable).getByText(activity.details)
        ).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('handles time period changes', async () => {
      const user = userEvent.setup();
      await renderWithProviders({
        preloadedState: {
          analytics: {
            data: mockAnalytics,
            metrics: mockMetrics,
            timeline: mockTimeline,
            loading: false,
            error: null,
            export: {
              loading: false,
              error: null,
              success: false,
            },
          },
        },
      });

      const select = screen.getByTestId('time-period-select');
      expect(select).toBeInTheDocument();

      await act(async () => {
        await user.selectOptions(select, '7d');
      });
      expect(select).toHaveValue('7d');
    });

    describe('Export', () => {
      it('handles successful export', async () => {
        const user = userEvent.setup();
        const store = createTestStore({
          analytics: {
            data: mockAnalytics,
            metrics: mockMetrics,
            timeline: mockTimeline,
            loading: false,
            error: null,
            export: {
              loading: false,
              error: null,
              success: false,
            },
          },
        });

        await renderWithProviders({
          store,
        });

        const exportButton = screen.getByTestId('export-button');
        expect(exportButton).toBeInTheDocument();

        // Mock the export action to update the store
        analyticsService.exportAnalytics.mockImplementation(() => {
          store.dispatch({
            type: 'analytics/exportAnalytics/pending',
          });
          store.dispatch({
            type: 'analytics/exportAnalytics/fulfilled',
            payload: {},
          });
          return Promise.resolve();
        });

        await act(async () => {
          await user.click(exportButton);
        });

        // Wait for success message
        await waitFor(() => {
          expect(screen.getByTestId('export-success')).toBeInTheDocument();
        });

        // Wait for success message to disappear
        await waitFor(
          () => {
            expect(
              screen.queryByTestId('export-success')
            ).not.toBeInTheDocument();
          },
          { timeout: 4000 }
        );
      });

      it('handles export error', async () => {
        const user = userEvent.setup();
        const store = createTestStore({
          analytics: {
            data: mockAnalytics,
            metrics: mockMetrics,
            timeline: mockTimeline,
            loading: false,
            error: null,
            export: {
              loading: false,
              error: null,
              success: false,
            },
          },
        });

        await renderWithProviders({
          store,
        });

        const exportButton = screen.getByTestId('export-button');
        expect(exportButton).toBeInTheDocument();

        // Mock the export action to fail
        const errorMessage = 'Export failed';
        analyticsService.exportAnalytics.mockImplementation(() => {
          store.dispatch({
            type: 'analytics/exportAnalytics/pending',
          });
          store.dispatch({
            type: 'analytics/exportAnalytics/rejected',
            error: { message: errorMessage },
          });
          return Promise.reject(new Error(errorMessage));
        });

        await act(async () => {
          await user.click(exportButton);
        });

        // Wait for error message
        await waitFor(() => {
          expect(screen.getByTestId('export-error')).toBeInTheDocument();
          expect(screen.getByTestId('export-error')).toHaveTextContent(
            errorMessage
          );
        });
      });
    });

    describe('Retry Functionality', () => {
      it('retries individual failed requests', async () => {
        const user = userEvent.setup();
        const store = createTestStore({
          analytics: {
            error: 'Failed to load analytics',
            data: null,
            metrics: null,
            timeline: null,
            loading: false,
            export: {
              loading: false,
              error: null,
              success: false,
            },
          },
        });

        // Mock the API calls to reject initially
        analyticsService.getAnalytics.mockRejectedValueOnce(
          new Error('Failed to load analytics')
        );
        analyticsService.getMetrics.mockRejectedValueOnce(
          new Error('Failed to load analytics')
        );
        analyticsService.getActivityTimeline.mockRejectedValueOnce(
          new Error('Failed to load analytics')
        );

        await renderWithProviders({
          store,
        });

        const retryButton = screen.getByTestId('retry-button');
        expect(retryButton).toBeInTheDocument();

        // Reset mocks to resolve on retry
        analyticsService.getAnalytics.mockResolvedValueOnce(mockAnalytics);
        analyticsService.getMetrics.mockResolvedValueOnce(mockMetrics);
        analyticsService.getActivityTimeline.mockResolvedValueOnce(
          mockTimeline
        );

        await act(async () => {
          await user.click(retryButton);
        });

        // Verify that the API calls were made again
        expect(analyticsService.getAnalytics).toHaveBeenCalledTimes(2);
        expect(analyticsService.getMetrics).toHaveBeenCalledTimes(2);
        expect(analyticsService.getActivityTimeline).toHaveBeenCalledTimes(2);

        // Verify that the error state is cleared
        await waitFor(() => {
          expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
        });
      });
    });
  });

  describe('Charts', () => {
    it('renders demographics chart correctly', async () => {
      await renderWithProviders({
        preloadedState: {
          analytics: {
            data: mockAnalytics,
            metrics: mockMetrics,
            timeline: mockTimeline,
            loading: false,
            error: null,
            export: {
              loading: false,
              error: null,
              success: false,
            },
          },
        },
      });

      // Check demographics chart
      Object.entries(mockAnalytics.demographics).forEach(([key, value]) => {
        const label = screen.getByText(key);
        expect(label).toBeInTheDocument();
        const valueElement = screen.getByText(value.toString());
        expect(valueElement).toBeInTheDocument();
      });
    });

    it('renders feature usage chart correctly', async () => {
      await renderWithProviders({
        preloadedState: {
          analytics: {
            data: mockAnalytics,
            metrics: mockMetrics,
            timeline: mockTimeline,
            loading: false,
            error: null,
            export: {
              loading: false,
              error: null,
              success: false,
            },
          },
        },
      });

      // Check feature usage chart
      mockAnalytics.featureUsage.forEach(feature => {
        const label = screen.getByText(feature.name);
        expect(label).toBeInTheDocument();
        const valueElement = screen.getByText(feature.count.toString());
        expect(valueElement).toBeInTheDocument();
      });
    });

    it('handles empty chart data gracefully', async () => {
      const emptyData = {
        ...mockAnalytics,
        demographics: {},
        featureUsage: [],
      };

      await renderWithProviders({
        preloadedState: {
          analytics: {
            data: emptyData,
            metrics: mockMetrics,
            timeline: mockTimeline,
            loading: false,
            error: null,
            export: {
              loading: false,
              error: null,
              success: false,
            },
          },
        },
      });

      // Charts should still render without errors
      expect(screen.getByText('Participant Demographics')).toBeInTheDocument();
      expect(screen.getByText('Popular Features')).toBeInTheDocument();
    });
  });

  describe('Tables', () => {
    it('renders top contributors table correctly', async () => {
      await renderWithProviders({
        preloadedState: {
          analytics: {
            data: mockAnalytics,
            metrics: mockMetrics,
            timeline: mockTimeline,
            loading: false,
            error: null,
            export: {
              loading: false,
              error: null,
              success: false,
            },
          },
        },
      });

      mockAnalytics.topContributors.forEach(contributor => {
        expect(screen.getByText(contributor.username)).toBeInTheDocument();
        expect(
          screen.getByText(contributor.contributions.toString())
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            new Date(contributor.lastActive).toLocaleDateString()
          )
        ).toBeInTheDocument();
      });
    });

    it('formats dates correctly in tables', async () => {
      await renderWithProviders({
        preloadedState: {
          analytics: {
            data: mockAnalytics,
            metrics: mockMetrics,
            timeline: mockTimeline,
            loading: false,
            error: null,
            export: {
              loading: false,
              error: null,
              success: false,
            },
          },
        },
      });

      // Check recent activity date formatting
      mockAnalytics.recentActivity.forEach(activity => {
        expect(
          screen.getByText(new Date(activity.timestamp).toLocaleString())
        ).toBeInTheDocument();
      });
    });

    it('handles empty table data gracefully', async () => {
      const emptyData = {
        ...mockAnalytics,
        recentActivity: [],
        topContributors: [],
      };

      await renderWithProviders({
        preloadedState: {
          analytics: {
            data: emptyData,
            metrics: mockMetrics,
            timeline: mockTimeline,
            loading: false,
            error: null,
            export: {
              loading: false,
              error: null,
              success: false,
            },
          },
        },
      });

      // Tables should still render without errors
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('Top Contributors')).toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('transitions from loading to success state', async () => {
      const store = createTestStore({
        analytics: {
          loading: true,
          data: null,
          metrics: null,
          timeline: null,
          error: null,
          export: {
            loading: false,
            error: null,
            success: false,
          },
        },
      });

      const { rerender } = await renderWithProviders({
        store,
      });

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

      // Update store to success state
      store.dispatch({
        type: 'analytics/fetchAnalytics/fulfilled',
        payload: mockAnalytics,
      });
      store.dispatch({
        type: 'analytics/fetchMetrics/fulfilled',
        payload: mockMetrics,
      });
      store.dispatch({
        type: 'analytics/fetchActivityTimeline/fulfilled',
        payload: mockTimeline,
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId('loading-indicator')
        ).not.toBeInTheDocument();
      });
      expect(screen.getAllByTestId('stat-card')).toHaveLength(4);
    });

    it('transitions from loading to error state', async () => {
      const store = createTestStore({
        analytics: {
          loading: true,
          data: null,
          metrics: null,
          timeline: null,
          error: null,
          export: {
            loading: false,
            error: null,
            success: false,
          },
        },
      });

      await renderWithProviders({
        store,
      });

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

      // Update store to error state
      store.dispatch({
        type: 'analytics/fetchAnalytics/rejected',
        error: { message: 'Failed to load analytics' },
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId('loading-indicator')
        ).not.toBeInTheDocument();
      });
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    it('transitions from error to success state after retry', async () => {
      const user = userEvent.setup();
      const store = createTestStore({
        analytics: {
          loading: false,
          data: null,
          metrics: null,
          timeline: null,
          error: 'Failed to load analytics',
          export: {
            loading: false,
            error: null,
            success: false,
          },
        },
      });

      await renderWithProviders({
        store,
      });

      expect(screen.getByTestId('error-message')).toBeInTheDocument();

      // Mock successful retry
      analyticsService.getAnalytics.mockResolvedValueOnce(mockAnalytics);
      analyticsService.getMetrics.mockResolvedValueOnce(mockMetrics);
      analyticsService.getActivityTimeline.mockResolvedValueOnce(mockTimeline);

      const retryButton = screen.getByTestId('retry-button');
      await act(async () => {
        await user.click(retryButton);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      });
      expect(screen.getAllByTestId('stat-card')).toHaveLength(4);
    });
  });
});
