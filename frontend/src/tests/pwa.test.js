import { METRICS } from '../config/monitoring.config';
import { monitoring } from '../services/monitoring';

// Mock service worker
const mockServiceWorker = {
  ready: Promise.resolve({
    addEventListener: jest.fn(),
    installing: {
      addEventListener: jest.fn(),
      state: 'installed',
    },
    active: {
      postMessage: jest.fn(),
    },
  }),
  addEventListener: jest.fn(),
  register: jest.fn(),
  controller: {
    state: 'activated',
  },
};

// Mock beforeinstallprompt event
class BeforeInstallPromptEvent extends Event {
  constructor() {
    super('beforeinstallprompt');
    this.prompt = jest.fn();
    this.userChoice = Promise.resolve({ outcome: 'accepted' });
  }
}

describe('PWA Features', () => {
  let originalServiceWorker;
  let originalOnline;

  beforeAll(() => {
    originalServiceWorker = navigator.serviceWorker;
    originalOnline = navigator.onLine;

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: mockServiceWorker,
    });

    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });

    // Initialize monitoring
    monitoring.init({
      appVersion: '1.0.0',
      environment: 'test',
      analyticsEndpoint: '/api/analytics',
    });
  });

  afterAll(() => {
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: originalServiceWorker,
    });

    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: originalOnline,
    });
  });

  describe('Service Worker', () => {
    it('should register service worker', async () => {
      mockServiceWorker.register.mockResolvedValueOnce({
        scope: '/app/',
        addEventListener: jest.fn(),
      });

      const registration = await navigator.serviceWorker.register(
        '/service-worker.js'
      );

      expect(mockServiceWorker.register).toHaveBeenCalledWith(
        '/service-worker.js'
      );
      expect(registration.scope).toBe('/app/');
    });

    it('should handle service worker updates', async () => {
      const registration = await mockServiceWorker.ready;
      const stateChangeCallback =
        registration.installing.addEventListener.mock.calls[0][1];

      // Simulate state change
      stateChangeCallback({ target: { state: 'installed' } });

      expect(registration.installing.addEventListener).toHaveBeenCalledWith(
        'statechange',
        expect.any(Function)
      );
    });

    it('should handle service worker messages', () => {
      const messageCallback =
        mockServiceWorker.addEventListener.mock.calls.find(
          call => call[0] === 'message'
        )[1];

      messageCallback({
        data: {
          type: 'CACHE_UPDATED',
          url: '/app.js',
        },
      });

      // Verify that monitoring tracked the cache update
      expect(fetch).toHaveBeenCalledWith(
        '/api/analytics',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(METRICS.SW.CACHE_UPDATED),
        })
      );
    });
  });

  describe('Installation', () => {
    it('should handle install prompt', () => {
      const event = new BeforeInstallPromptEvent();
      window.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledWith(
        '/api/analytics',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(METRICS.PWA.INSTALL_PROMPT),
        })
      );
    });

    it('should track install result', async () => {
      const event = new BeforeInstallPromptEvent();
      window.dispatchEvent(event);

      await event.userChoice;

      expect(fetch).toHaveBeenCalledWith(
        '/api/analytics',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(METRICS.PWA.INSTALL_RESULT),
        })
      );
    });
  });

  describe('Offline Support', () => {
    it('should handle going offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));

      expect(document.body.classList.contains('offline')).toBe(true);
    });

    it('should handle going online', () => {
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));

      expect(document.body.classList.contains('offline')).toBe(false);
    });

    it('should track offline duration', () => {
      // Go offline
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));

      // Fast-forward time
      jest.advanceTimersByTime(5000);

      // Go online
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));

      expect(fetch).toHaveBeenCalledWith(
        '/api/analytics',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(METRICS.PWA.OFFLINE_DURATION),
        })
      );
    });
  });

  describe('Updates', () => {
    it('should handle update found', async () => {
      const registration = await mockServiceWorker.ready;
      const updateCallback = registration.addEventListener.mock.calls.find(
        call => call[0] === 'updatefound'
      )[1];

      updateCallback();

      expect(registration.installing.addEventListener).toHaveBeenCalledWith(
        'statechange',
        expect.any(Function)
      );
    });

    it('should handle update accepted', async () => {
      const registration = await mockServiceWorker.ready;
      const stateChangeCallback =
        registration.installing.addEventListener.mock.calls[0][1];

      // Simulate installed state
      stateChangeCallback({ target: { state: 'installed' } });

      // Simulate user accepting update
      window.confirm = jest.fn(() => true);

      expect(registration.active.postMessage).toHaveBeenCalledWith({
        type: 'SKIP_WAITING',
      });
    });
  });
});
