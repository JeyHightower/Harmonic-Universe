import { configureStore } from '@reduxjs/toolkit';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import universeReducer from '../../../store/universeSlice';
import Dashboard from '../Dashboard';

const mockAnalytics = {
  users: 100,
  sessions: 50,
  averageSessionDuration: '30m',
  bounceRate: '25%',
  topPages: ['/home', '/about', '/contact'],
};

const renderWithProvider = (ui, initialState = {}) => {
  const store = configureStore({
    reducer: {
      universe: universeReducer,
    },
    preloadedState: {
      universe: {
        analytics: null,
        loading: false,
        error: null,
        ...initialState,
      },
    },
  });

  return {
    ...render(<Provider store={store}>{ui}</Provider>),
    store,
  };
};

describe('Dashboard', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('fetches and displays analytics data', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAnalytics),
    });

    const { getByText } = renderWithProvider(<Dashboard />);

    expect(getByText('Loading analytics...')).toBeInTheDocument();

    await waitFor(() => {
      expect(getByText(`Users: ${mockAnalytics.users}`)).toBeInTheDocument();
      expect(
        getByText(`Sessions: ${mockAnalytics.sessions}`)
      ).toBeInTheDocument();
      expect(
        getByText(
          `Average Session Duration: ${mockAnalytics.averageSessionDuration}`
        )
      ).toBeInTheDocument();
      expect(
        getByText(`Bounce Rate: ${mockAnalytics.bounceRate}`)
      ).toBeInTheDocument();
    });

    mockAnalytics.topPages.forEach(async page => {
      await waitFor(() => {
        expect(getByText(page)).toBeInTheDocument();
      });
    });
  });

  it('handles data export', async () => {
    const user = userEvent.setup();
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAnalytics),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Export successful' }),
      });

    const { getByText } = renderWithProvider(<Dashboard />);

    await waitFor(() => {
      expect(getByText(`Users: ${mockAnalytics.users}`)).toBeInTheDocument();
    });

    const exportButton = getByText('Export Data');
    await user.click(exportButton);

    expect(getByText('Exporting...')).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  it('handles error state', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Failed to fetch analytics'));

    const { getByText } = renderWithProvider(<Dashboard />);

    await waitFor(() => {
      expect(getByText('Failed to fetch analytics')).toBeInTheDocument();
    });
  });
});
