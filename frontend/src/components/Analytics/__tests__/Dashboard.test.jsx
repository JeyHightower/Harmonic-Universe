import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import Dashboard from '../Dashboard';

// Mock fetch globally
global.fetch = jest.fn();

// Mock Chart.js to avoid canvas errors
jest.mock('chart.js');
jest.mock('react-chartjs-2', () => ({
  Line: () => null,
}));

describe('Analytics Dashboard', () => {
  const mockSummaryData = {
    summary: {
      pwa_install: {
        total: 100,
        count: 50,
        min: 1,
        max: 5,
        average: 2,
        tags: {
          platform: {
            ios: 20,
            android: 30,
          },
          outcome: {
            success: 45,
            failed: 5,
          },
        },
      },
      service_worker: {
        total: 200,
        count: 100,
        min: 0,
        max: 2,
        average: 1,
        tags: {
          event: {
            registration: 80,
            activation: 20,
          },
        },
      },
    },
  };

  beforeEach(() => {
    fetch.mockClear();
  });

  it('shows loading state initially', () => {
    fetch.mockImplementationOnce(() => new Promise(() => {}));
    render(<Dashboard />);
    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('shows error state when fetch fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Failed to fetch'));
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });
  });

  it('shows empty state when no data available', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ summary: {} }),
    });
    render(<Dashboard />);
    await waitFor(() => {
      expect(
        screen.getByText('No analytics data available')
      ).toBeInTheDocument();
    });
  });

  it('displays metrics data correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSummaryData,
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByLabelText('Select Metric:')).toBeInTheDocument();
    });

    // Check if metrics are in the select dropdown
    const select = screen.getByLabelText('Select Metric:');
    expect(select).toHaveValue('pwa_install');
    expect(screen.getByText('100.00')).toBeInTheDocument(); // Total
    expect(screen.getByText('2.00')).toBeInTheDocument(); // Average
  });

  it('allows switching between metrics', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSummaryData,
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByLabelText('Select Metric:')).toBeInTheDocument();
    });

    const select = screen.getByLabelText('Select Metric:');
    fireEvent.change(select, { target: { value: 'service_worker' } });

    expect(screen.getByText('200.00')).toBeInTheDocument(); // New total
    expect(screen.getByText('1.00')).toBeInTheDocument(); // New average
  });

  it('refreshes data periodically', async () => {
    jest.useFakeTimers();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSummaryData,
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    });

    // First call on mount
    expect(fetch).toHaveBeenCalledTimes(1);

    // Fast-forward 5 minutes
    jest.advanceTimersByTime(5 * 60 * 1000);

    // Should have made another call
    expect(fetch).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it('displays tag distribution correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSummaryData,
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Tags Distribution')).toBeInTheDocument();
    });

    // Check platform tags
    expect(screen.getByText('platform')).toBeInTheDocument();
    expect(screen.getByText('ios')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('android')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();

    // Check outcome tags
    expect(screen.getByText('outcome')).toBeInTheDocument();
    expect(screen.getByText('success')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('failed')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
