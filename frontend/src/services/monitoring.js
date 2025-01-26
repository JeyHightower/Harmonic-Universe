import { v4 as uuidv4 } from "uuid";
import { METRICS } from "../../../config/monitoring.config";

class Monitoring {
  constructor() {
    this.config = {
      appVersion: "",
      environment: process.env.NODE_ENV,
      enabled: true,
    };
    this.metrics = {
      errors: [],
      performance: {},
      userActions: [],
    };
    this.observers = new Set();
    this.failedMetrics = new Map();
    this.retryTimeout = null;
    this.offlineDuration = 0;
    this.offlineStart = null;
    this.isTracking = false;
    this.sessionId = null;
    this.errorBuffer = [];
    this.metricBuffer = [];
    this.bufferSize = 10;
    this.flushInterval = 5000; // 5 seconds
  }

  init(config) {
    this.config = { ...this.config, ...config };
    this.setupErrorHandling();
    this.setupPerformanceMonitoring();
    this.setupUserActionTracking();
    this.sessionId = this._getOrCreateSessionId();

    // Start buffer flush interval
    setInterval(() => this._flushBuffers(), this.flushInterval);

    // Track session start
    this.trackEvent(METRICS.SESSION.START, 1, {
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      language: navigator.language,
    });

    // Track session end on page unload
    window.addEventListener("beforeunload", () => {
      this.trackEvent(METRICS.SESSION.END, 1, {
        sessionId: this.sessionId,
        duration: (Date.now() - this.sessionStart) / 1000,
      });
      this._flushBuffers(true); // Synchronous flush
    });

    this.setupNetworkListeners();
    return this;
  }

  setupErrorHandling() {
    window.onerror = (message, source, lineno, colno, error) => {
      this.logError({
        message,
        source,
        lineno,
        colno,
        stack: error?.stack,
        timestamp: new Date().toISOString(),
      });
    };

    window.addEventListener("unhandledrejection", (event) => {
      this.logError({
        message: event.reason?.message || "Unhandled Promise Rejection",
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
      });
    });
  }

  setupPerformanceMonitoring() {
    if (window.performance && window.performance.getEntriesByType) {
      // Monitor page load performance
      window.addEventListener("load", () => {
        const navigationEntry = performance.getEntriesByType("navigation")[0];
        this.logPerformance("pageLoad", {
          loadTime: navigationEntry.loadEventEnd - navigationEntry.startTime,
          domContentLoaded:
            navigationEntry.domContentLoadedEventEnd -
            navigationEntry.startTime,
          firstPaint: performance.getEntriesByName("first-paint")[0]?.startTime,
          firstContentfulPaint: performance.getEntriesByName(
            "first-contentful-paint",
          )[0]?.startTime,
        });
      });

      // Monitor resource loading
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.logPerformance("resourceTiming", {
            name: entry.name,
            duration: entry.duration,
            transferSize: entry.transferSize,
            initiatorType: entry.initiatorType,
          });
        });
      });

      observer.observe({ entryTypes: ["resource"] });
    }
  }

  setupUserActionTracking() {
    document.addEventListener("click", (event) => {
      const target = event.target;
      if (target.matches('button, a, [role="button"]')) {
        this.logUserAction("click", {
          element: target.tagName.toLowerCase(),
          id: target.id,
          text: target.textContent?.trim(),
          path: window.location.pathname,
        });
      }
    });

    window.addEventListener("popstate", () => {
      this.logUserAction("navigation", {
        path: window.location.pathname,
      });
    });
  }

  logError(error) {
    if (!this.config.enabled) return;
    this.metrics.errors.push({
      ...error,
      appVersion: this.config.appVersion,
      environment: this.config.environment,
    });
    this.sendMetrics("error", error);
  }

  logPerformance(type, data) {
    if (!this.config.enabled) return;
    if (!this.metrics.performance[type]) {
      this.metrics.performance[type] = [];
    }
    const metric = {
      ...data,
      timestamp: new Date().toISOString(),
      appVersion: this.config.appVersion,
      environment: this.config.environment,
    };
    this.metrics.performance[type].push(metric);
    this.sendMetrics("performance", { type, data: metric });
  }

  logUserAction(type, data) {
    if (!this.config.enabled) return;
    const action = {
      type,
      ...data,
      timestamp: new Date().toISOString(),
      appVersion: this.config.appVersion,
      environment: this.config.environment,
    };
    this.metrics.userActions.push(action);
    this.sendMetrics("userAction", action);
  }

  async sendMetrics(type, data) {
    if (!this.config.enabled) return;
    try {
      const payload = {
        type,
        data,
        timestamp: new Date().toISOString(),
        appVersion: this.config.appVersion,
        environment: this.config.environment,
      };

      // In development, just log to console
      if (this.config.environment === "development") {
        console.log("[Monitoring]", payload);
        return;
      }

      // In production, send to monitoring service
      await fetch("/api/monitoring/metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("[Monitoring] Failed to send metrics:", error);
    }
  }

  getMetrics() {
    return {
      errors: [...this.metrics.errors],
      performance: { ...this.metrics.performance },
      userActions: [...this.metrics.userActions],
    };
  }

  clearMetrics() {
    this.metrics = {
      errors: [],
      performance: {},
      userActions: [],
    };
  }

  startTracking() {
    if (this.isTracking) return;
    this.isTracking = true;
    this.sessionStart = Date.now();

    // Track PWA installation
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.trackEvent(METRICS.PWA.INSTALL_PROMPT, 1);

      e.userChoice.then((choiceResult) => {
        this.trackEvent(METRICS.PWA.INSTALL_RESULT, 1, {
          outcome: choiceResult.outcome,
        });
      });
    });

    // Track service worker registration
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        this.trackEvent(METRICS.SW.REGISTRATION, 1, {
          state: "ready",
        });

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;

          newWorker.addEventListener("statechange", () => {
            this.trackEvent(METRICS.SW.STATE_CHANGE, 1, {
              state: newWorker.state,
            });
          });
        });
      });

      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data.type === "CACHE_UPDATED") {
          this.trackEvent(METRICS.SW.CACHE_UPDATED, 1, {
            url: event.data.url,
          });
        }
      });
    }

    // Track performance metrics
    if ("performance" in window) {
      // First Paint
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackPerformance(entry.name, entry.startTime, {
            entryType: entry.entryType,
          });
        }
      });

      observer.observe({
        entryTypes: ["paint", "largest-contentful-paint", "first-input"],
      });

      // Core Web Vitals
      if ("web-vital" in window) {
        window.webVitals.getCLS((metric) => {
          this.trackPerformance(METRICS.PERFORMANCE.CLS, metric.value);
        });

        window.webVitals.getFID((metric) => {
          this.trackPerformance(METRICS.PERFORMANCE.FID, metric.value);
        });

        window.webVitals.getLCP((metric) => {
          this.trackPerformance(METRICS.PERFORMANCE.LCP, metric.value);
        });
      }
    }

    // Start retry mechanism for failed metrics
    this.startRetrying();
  }

  stopTracking() {
    this.isTracking = false;
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  setupNetworkListeners() {
    window.addEventListener("online", () => {
      if (this.offlineStart) {
        const duration = Date.now() - this.offlineStart;
        this.offlineDuration += duration;
        this.offlineStart = null;

        this.trackEvent(METRICS.PWA.OFFLINE_DURATION, duration);
        this.notifyObservers({ type: "online", duration });
      }
      this.retryFailedMetrics();
    });

    window.addEventListener("offline", () => {
      this.offlineStart = Date.now();
      this.notifyObservers({ type: "offline" });
    });
  }

  trackError(error, context = {}) {
    const errorData = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      context: {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    };

    this.errorBuffer.push(errorData);

    if (this.errorBuffer.length >= this.bufferSize) {
      this._flushErrorBuffer();
    }
  }

  trackEvent(name, value, tags = {}) {
    const metric = {
      name,
      value,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      tags: {
        ...tags,
        environment: this.config.environment,
        version: this.config.appVersion,
      },
    };

    this.metricBuffer.push(metric);

    if (this.metricBuffer.length >= this.bufferSize) {
      this._flushMetricBuffer();
    }
  }

  trackPerformance(name, value, tags = {}) {
    return this.trackEvent(name, value, {
      ...tags,
      type: "performance",
    });
  }

  _handleError(event) {
    this.trackError(event.error || new Error(event.message), {
      type: "uncaught_error",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  }

  _handlePromiseError(event) {
    this.trackError(event.reason, {
      type: "unhandled_rejection",
    });
  }

  _getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem("monitoring_session_id");
    if (!sessionId) {
      sessionId = uuidv4();
      sessionStorage.setItem("monitoring_session_id", sessionId);
    }
    return sessionId;
  }

  async _flushBuffers(sync = false) {
    await Promise.all([
      this._flushErrorBuffer(sync),
      this._flushMetricBuffer(sync),
    ]);
  }

  async _flushErrorBuffer(sync = false) {
    if (this.errorBuffer.length === 0) return;

    const errors = [...this.errorBuffer];
    this.errorBuffer = [];

    try {
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ errors }),
      };

      if (sync) {
        options.keepalive = true;
      }

      await fetch("/api/monitoring/errors", options);
    } catch (error) {
      console.error("Failed to flush error buffer:", error);
      // Re-add failed items back to buffer
      this.errorBuffer.unshift(...errors);
    }
  }

  async _flushMetricBuffer(sync = false) {
    if (this.metricBuffer.length === 0) return;

    const metrics = [...this.metricBuffer];
    this.metricBuffer = [];

    try {
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ metrics }),
      };

      if (sync) {
        options.keepalive = true;
      }

      await fetch("/api/monitoring/track", options);
    } catch (error) {
      console.error("Failed to flush metric buffer:", error);
      // Re-add failed items back to buffer
      this.metricBuffer.unshift(...metrics);
    }
  }

  storeFailedMetric(metric) {
    const key = `${metric.name}-${metric.timestamp}`;
    this.failedMetrics.set(key, metric);
    this.notifyObservers({ type: "metricFailed", metric });
  }

  async retryFailedMetrics() {
    if (this.failedMetrics.size === 0) return;

    const metrics = Array.from(this.failedMetrics.values());
    this.failedMetrics.clear();

    for (const metric of metrics) {
      try {
        await this.trackEvent(metric.name, metric.value, metric.tags);
      } catch (error) {
        console.warn("Failed to retry metric:", error);
        this.storeFailedMetric(metric);
      }
    }
  }

  startRetrying() {
    const retry = () => {
      if (navigator.onLine) {
        this.retryFailedMetrics();
      }
      this.retryTimeout = setTimeout(retry, 60000); // Retry every minute
    };
    retry();
  }

  addObserver(observer) {
    this.observers.add(observer);
  }

  removeObserver(observer) {
    this.observers.delete(observer);
  }

  notifyObservers(event) {
    for (const observer of this.observers) {
      observer(event);
    }
  }

  getOfflineDuration() {
    let total = this.offlineDuration;
    if (this.offlineStart) {
      total += Date.now() - this.offlineStart;
    }
    return total;
  }
}

export const monitoring = new Monitoring();
