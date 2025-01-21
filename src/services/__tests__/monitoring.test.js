import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MonitoringService from '../monitoring';

describe('MonitoringService', () => {
  let monitoringService;
  const mockStorage = {};

  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(key => mockStorage[key]),
        setItem: vi.fn((key, value) => {
          mockStorage[key] = value;
        }),
        removeItem: vi.fn(key => {
          delete mockStorage[key];
        }),
        clear: vi.fn(() => {
          Object.keys(mockStorage).forEach(key => {
            delete mockStorage[key];
          });
        }),
      },
      writable: true,
    });

    // Mock navigator.onLine
    Object.defineProperty(window.navigator, 'onLine', {
      value: true,
      writable: true,
    });

    // Mock PerformanceObserver
    global.PerformanceObserver = vi.fn(callback => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Mock service worker
    global.navigator.serviceWorker = {
      register: vi.fn(() => Promise.resolve({ state: 'activated' })),
      ready: Promise.resolve({ state: 'activated' }),
    };

    monitoringService = new MonitoringService();
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockStorage.clear();
  });

  describe('Network Status Monitoring', () => {
    it('should track offline duration', async () => {
      const startTime = Date.now();
      window.dispatchEvent(new Event('offline'));
      await new Promise(resolve => setTimeout(resolve, 100));
      window.dispatchEvent(new Event('online'));

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'offlineDuration',
        expect.any(Number)
      );
    });

    it('should notify observers of online/offline events', () => {
      const observer = {
        update: vi.fn(),
      };
      monitoringService.addObserver(observer);
      window.dispatchEvent(new Event('offline'));
      expect(observer.update).toHaveBeenCalledWith({
        type: 'network',
        status: 'offline',
      });
    });
  });

  describe('Metric Tracking', () => {
    it('should track metrics with correct format', async () => {
      const metric = { name: 'test', value: 100 };
      await monitoringService.trackMetric(metric);
      expect(global.fetch).toHaveBeenCalledWith('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      });
    });

    it('should store failed metrics for retry', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      const metric = { name: 'test', value: 100 };
      await monitoringService.trackMetric(metric);
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'failedMetrics',
        JSON.stringify([metric])
      );
    });
  });

  describe('Service Worker Tracking', () => {
    it('should track service worker registration', async () => {
      await monitoringService.trackServiceWorker();
      expect(navigator.serviceWorker.register).toHaveBeenCalled();
    });

    it('should track service worker state changes', () => {
      const observer = { update: vi.fn() };
      monitoringService.addObserver(observer);
      const mockServiceWorker = navigator.serviceWorker;
      mockServiceWorker.active.postMessage('statechange');
      expect(observer.update).toHaveBeenCalledWith({
        type: 'serviceWorker',
        state: 'activated',
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', () => {
      const observer = { update: vi.fn() };
      monitoringService.addObserver(observer);
      const performanceObserver = new PerformanceObserver(() => {});
      performanceObserver.observe();
      expect(observer.update).toHaveBeenCalledWith({
        type: 'performance',
        name: 'first-contentful-paint',
        value: 1000,
      });
    });
  });

  describe('Observer Pattern', () => {
    it('should notify observers when metrics are tracked', async () => {
      const observer = { update: vi.fn() };
      monitoringService.addObserver(observer);
      const metric = { name: 'test', value: 100 };
      await monitoringService.trackMetric(metric);
      expect(observer.update).toHaveBeenCalledWith({
        type: 'metric',
        ...metric,
      });
    });

    it('should remove observers', () => {
      const observer = { update: vi.fn() };
      monitoringService.addObserver(observer);
      monitoringService.removeObserver(observer);
      window.dispatchEvent(new Event('offline'));
      expect(observer.update).not.toHaveBeenCalled();
    });
  });

  describe('Retry Mechanism', () => {
    it('should retry failed metrics when online', async () => {
      const failedMetrics = [
        { name: 'test1', value: 100 },
        { name: 'test2', value: 200 },
      ];
      window.localStorage.getItem.mockReturnValue(
        JSON.stringify(failedMetrics)
      );
      window.dispatchEvent(new Event('online'));
      expect(global.fetch).toHaveBeenCalledTimes(failedMetrics.length);
    });
  });
});
