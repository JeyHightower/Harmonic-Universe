import { METRICS as ConfigMETRICS } from '../../config/monitoring.config';
import { monitoring } from '../monitoring';

describe('MonitoringService', () => {
  let originalFetch;
  let mockObservers;
  let originalOnline;

  beforeAll(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn();
    originalOnline = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
  });

  beforeEach(() => {
    // Mock localStorage
    const mockStorage = {};
    global.localStorage = {
      getItem: jest.fn(key => mockStorage[key]),
      setItem: jest.fn((key, value) => {
        mockStorage[key] = value;
      }),
      clear: jest.fn(() => {
        mockStorage = {};
      }),
    };

    // Mock PerformanceObserver
    global.PerformanceObserver = jest.fn(callback => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
    }));

    // Reset fetch mock
    fetch.mockClear();

    // Track observers
    mockObservers = new Set();

    monitoring.init({
      appVersion: '1.0.0',
      environment: 'test',
      analyticsEndpoint: '/api/analytics',
    });
    monitoring.failedMetrics.clear();
    monitoring.offlineDuration = 0;
    monitoring.offlineStart = null;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: originalOnline,
    });
  });

  describe('Network Status Monitoring', () => {
    it('should track offline duration', () => {
      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));

      // Fast-forward time by 1000ms
      jest.advanceTimersByTime(1000);

      // Simulate going online
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));

      expect(monitoring.getOfflineDuration()).toBeGreaterThan(0);
    });

    it('should notify observers of online/offline events', () => {
      const observer = jest.fn();
      monitoring.addObserver(observer);

      window.dispatchEvent(new Event('offline'));
      expect(observer).toHaveBeenCalledWith({ type: 'offline' });

      window.dispatchEvent(new Event('online'));
      expect(observer).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'online',
          duration: expect.any(Number),
        })
      );
    });
  });

  describe('Metric Tracking', () => {
    it('should track metrics with correct format', async () => {
      const metric = {
        name: ConfigMETRICS.CUSTOM,
        value: 100,
        tags: { type: 'test' },
      };

      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: '123' }),
        })
      );

      await monitoring.trackEvent(metric.name, metric.value, metric.tags);

      expect(fetch).toHaveBeenCalledWith(
        '/api/analytics',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining(metric.name),
        })
      );
    });

    it('should store failed metrics for retry', async () => {
      const metric = {
        name: ConfigMETRICS.CUSTOM,
        value: 100,
        tags: { type: 'test' },
      };

      fetch.mockImplementationOnce(() =>
        Promise.reject(new Error('Network error'))
      );

      await monitoring.trackEvent(metric.name, metric.value, metric.tags);

      expect(monitoring.failedMetrics.size).toBe(1);
    });
  });

  describe('Service Worker Tracking', () => {
    it('should track service worker registration', async () => {
      monitoring.startTracking();

      await mockServiceWorker.ready;

      expect(fetch).toHaveBeenCalledWith(
        '/api/analytics',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(ConfigMETRICS.SW.REGISTRATION),
        })
      );
    });

    it('should track service worker state changes', async () => {
      monitoring.startTracking();

      const registration = await mockServiceWorker.ready;
      const stateChangeCallback =
        registration.installing.addEventListener.mock.calls[0][1];

      stateChangeCallback();

      expect(fetch).toHaveBeenCalledWith(
        '/api/analytics',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(ConfigMETRICS.SW.STATE_CHANGE),
        })
      );
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', () => {
      const metric = {
        name: 'LCP',
        value: 2500,
        tags: { type: 'performance' },
      };

      monitoring.trackPerformance(metric.name, metric.value, metric.tags);

      expect(fetch).toHaveBeenCalledWith(
        '/api/analytics',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(metric.name),
        })
      );
    });
  });

  describe('Observer Pattern', () => {
    it('should notify observers when metrics are tracked', async () => {
      const observer = jest.fn();
      monitoring.addObserver(observer);

      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: '123' }),
        })
      );

      await monitoring.trackEvent(ConfigMETRICS.CUSTOM, 100);

      expect(observer).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'metric',
          metric: expect.any(Object),
        })
      );
    });

    it('should remove observers', () => {
      const observer = jest.fn();
      monitoring.addObserver(observer);
      monitoring.removeObserver(observer);

      monitoring.notifyObservers({ type: 'test' });

      expect(observer).not.toHaveBeenCalled();
    });
  });

  describe('Retry Mechanism', () => {
    it('should retry failed metrics when online', async () => {
      const metric = {
        name: ConfigMETRICS.CUSTOM,
        value: 100,
        tags: { type: 'test' },
      };

      // First attempt fails
      fetch.mockImplementationOnce(() =>
        Promise.reject(new Error('Network error'))
      );

      await monitoring.trackEvent(metric.name, metric.value, metric.tags);
      expect(monitoring.failedMetrics.size).toBe(1);

      // Second attempt succeeds
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: '123' }),
        })
      );

      await monitoring.retryFailedMetrics();
      expect(monitoring.failedMetrics.size).toBe(0);
    });
  });
});
