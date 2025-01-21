import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { monitoring } from '../monitoring';

describe('Monitoring Service', () => {
  const mockConfig = {
    appVersion: '1.0.0',
    environment: 'test',
    analyticsEndpoint: '/api/analytics',
    errorEndpoint: '/api/errors',
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn();
    monitoring.init(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
    monitoring.clearMetrics();
  });

  describe('Initialization', () => {
    it('initializes with correct configuration', () => {
      expect(monitoring.getMetrics()).toEqual({
        errors: [],
        performance: [],
        userActions: [],
      });
    });

    it('sets up error handling', () => {
      const error = new Error('Test error');
      window.dispatchEvent(new ErrorEvent('error', { error }));
      expect(mockConfig.onError).toHaveBeenCalledWith(error);
    });
  });

  describe('Error Tracking', () => {
    it('tracks and buffers errors', () => {
      const error = new Error('Test error');
      monitoring.logError(error);
      expect(monitoring.getMetrics().errors).toHaveLength(1);
      expect(monitoring.getMetrics().errors[0]).toMatchObject({
        message: 'Test error',
        type: 'Error',
      });
    });

    it('handles promise rejection errors', async () => {
      const error = new Error('Promise error');
      window.dispatchEvent(
        new PromiseRejectionEvent('unhandledrejection', {
          reason: error,
          promise: Promise.reject(error),
          cancelable: true,
        })
      );
      expect(mockConfig.onError).toHaveBeenCalledWith(error);
    });
  });

  describe('Performance Monitoring', () => {
    it('tracks performance metrics', () => {
      monitoring.logPerformance('page-load', 1500);
      expect(monitoring.getMetrics().performance).toHaveLength(1);
      expect(monitoring.getMetrics().performance[0]).toMatchObject({
        name: 'page-load',
        value: 1500,
      });
    });

    it('tracks custom performance marks', () => {
      performance.mark('start');
      performance.mark('end');
      performance.measure('test', 'start', 'end');

      const entries = performance.getEntriesByType('measure');
      monitoring.logPerformance('custom-measure', entries[0].duration);

      expect(monitoring.getMetrics().performance).toHaveLength(1);
    });
  });

  describe('User Action Tracking', () => {
    it('tracks user actions', () => {
      monitoring.logUserAction('button-click', { buttonId: 'submit' });
      expect(monitoring.getMetrics().userActions).toHaveLength(1);
      expect(monitoring.getMetrics().userActions[0]).toMatchObject({
        type: 'button-click',
        data: { buttonId: 'submit' },
      });
    });

    it('includes timestamp with user actions', () => {
      monitoring.logUserAction('form-submit', { formId: 'login' });
      expect(monitoring.getMetrics().userActions[0]).toHaveProperty(
        'timestamp'
      );
    });
  });

  describe('Metric Buffering and Sending', () => {
    it('buffers metrics until flush threshold', async () => {
      for (let i = 0; i < 5; i++) {
        monitoring.logError(new Error(`Error ${i}`));
      }

      expect(monitoring.getMetrics().errors).toHaveLength(5);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('sends metrics when buffer is full', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true });

      for (let i = 0; i < 50; i++) {
        monitoring.logError(new Error(`Error ${i}`));
      }

      await vi.runAllTimersAsync();

      expect(global.fetch).toHaveBeenCalledWith(
        mockConfig.errorEndpoint,
        expect.any(Object)
      );
    });

    it('retries failed metric sends', async () => {
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true });

      monitoring.logError(new Error('Test error'));
      await vi.runAllTimersAsync();

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Network Monitoring', () => {
    it('tracks failed network requests', () => {
      const mockXHR = {
        status: 500,
        responseURL: 'https://api.example.com/data',
        getAllResponseHeaders: () => '',
      };

      window.dispatchEvent(
        new ErrorEvent('error', {
          error: new Error('Network request failed'),
          target: mockXHR,
        })
      );

      expect(monitoring.getMetrics().errors[0]).toMatchObject({
        type: 'NetworkError',
        url: 'https://api.example.com/data',
        status: 500,
      });
    });

    it('tracks slow network requests', async () => {
      const start = performance.now();
      const mockXHR = {
        status: 200,
        responseURL: 'https://api.example.com/data',
        getAllResponseHeaders: () => '',
        timing: {
          requestStart: start,
          responseEnd: start + 5000, // 5s response time
        },
      };

      window.dispatchEvent(new Event('load', { target: mockXHR }));

      expect(monitoring.getMetrics().performance).toHaveLength(1);
      expect(monitoring.getMetrics().performance[0].value).toBeGreaterThan(
        5000
      );
    });
  });

  describe('Session Tracking', () => {
    it('maintains session ID across page loads', () => {
      const sessionId1 = monitoring._getOrCreateSessionId();
      const sessionId2 = monitoring._getOrCreateSessionId();
      expect(sessionId1).toBe(sessionId2);
    });

    it('tracks session duration', () => {
      const startTime = Date.now();
      vi.advanceTimersByTime(300000); // 5 minutes

      monitoring.logUserAction('page-view', {});
      const metrics = monitoring.getMetrics().userActions[0];

      expect(metrics.sessionDuration).toBeGreaterThanOrEqual(300000);
    });
  });

  describe('Error Recovery', () => {
    it('recovers from storage errors', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => monitoring.logError(new Error('Test'))).not.toThrow();
      localStorage.setItem = originalSetItem;
    });

    it('handles invalid metric data', () => {
      const circularObj = {};
      circularObj.self = circularObj;

      expect(() => monitoring.logUserAction('test', circularObj)).not.toThrow();
    });
  });
});
