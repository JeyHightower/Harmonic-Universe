export const METRICS = {
  PWA: {
    INSTALL_PROMPT: "pwa_install_prompt",
    INSTALL_RESULT: "pwa_install_result",
    UPDATE_AVAILABLE: "pwa_update_available",
    UPDATE_INSTALLED: "pwa_update_installed",
    OFFLINE_USAGE: "pwa_offline_usage",
  },
  SW: {
    REGISTRATION: "sw_registration",
    STATE_CHANGE: "sw_state_change",
    ERROR: "sw_error",
    CACHE_UPDATED: "sw_cache_updated",
    SYNC_QUEUED: "sw_sync_queued",
    SYNC_COMPLETED: "sw_sync_completed",
    SYNC_FAILED: "sw_sync_failed",
  },
  PERFORMANCE: {
    FIRST_PAINT: "performance_first-paint",
    FIRST_CONTENTFUL_PAINT: "performance_first-contentful-paint",
    LARGEST_CONTENTFUL_PAINT: "performance_largest-contentful-paint",
    FIRST_INPUT_DELAY: "performance_first-input-delay",
    CUMULATIVE_LAYOUT_SHIFT: "performance_cumulative-layout-shift",
    TIME_TO_INTERACTIVE: "performance_time-to-interactive",
    CUSTOM_OPERATION: "performance_custom-operation",
  },
  SESSION: {
    START: "session_start",
    END: "session_end",
    ROUTE_CHANGE: "session_route_change",
    INTERACTION: "session_interaction",
  },
  ERROR: {
    UNCAUGHT: "error_uncaught",
    UNHANDLED_REJECTION: "error_unhandled_rejection",
    API: "error_api",
    VALIDATION: "error_validation",
    CUSTOM: "error_custom",
  },
  FEATURE: {
    UNIVERSE_CREATE: "feature_universe_create",
    UNIVERSE_UPDATE: "feature_universe_update",
    UNIVERSE_DELETE: "feature_universe_delete",
    AUDIO_PROCESS: "feature_audio_process",
    AUDIO_EXPORT: "feature_audio_export",
    COLLABORATION_START: "feature_collaboration_start",
    COLLABORATION_END: "feature_collaboration_end",
  },
  RESOURCE: {
    MEMORY_USAGE: "resource_memory_usage",
    CPU_USAGE: "resource_cpu_usage",
    STORAGE_USAGE: "resource_storage_usage",
    NETWORK_REQUEST: "resource_network_request",
    WEBSOCKET_MESSAGE: "resource_websocket_message",
  },
};

export const SAMPLING_RATES = {
  PERFORMANCE: 0.1, // 10% of users
  ERROR: 1.0, // 100% of errors
  SESSION: 1.0, // 100% of sessions
  FEATURE: 0.5, // 50% of feature usage
  RESOURCE: 0.1, // 10% of resource metrics
};

export const RETENTION_POLICIES = {
  RAW_METRICS: {
    days: 30,
    description: "Keep raw metrics for 30 days",
  },
  HOURLY_ROLLUPS: {
    days: 90,
    description: "Keep hourly summaries for 90 days",
  },
  DAILY_ROLLUPS: {
    days: 365,
    description: "Keep daily summaries for 1 year",
  },
};

export const BUFFER_CONFIG = {
  MAX_SIZE: 10,
  FLUSH_INTERVAL: 5000, // 5 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

export const ERROR_CONFIG = {
  STACK_TRACE_LIMIT: 50,
  IGNORED_ERRORS: ["ResizeObserver loop limit exceeded", "Script error."],
  SENSITIVE_FIELDS: ["password", "token", "key", "secret", "credential"],
};

export const ALERT_RULES = {
  ERROR_RATE: {
    threshold: 0.05, // 5% error rate
    window: "5m", // Over 5 minutes
    cooldown: "15m", // Wait 15 minutes between alerts
  },
  PERFORMANCE: {
    lcp: 2500, // LCP threshold in ms
    fid: 100, // FID threshold in ms
    cls: 0.1, // CLS threshold
  },
  OFFLINE: {
    duration: 300000, // Alert if offline for more than 5 minutes
  },
};

export const BATCH_CONFIG = {
  maxSize: 100, // Maximum number of events in a batch
  maxWait: 30000, // Maximum time to wait before sending a batch
  retryLimit: 3, // Number of retry attempts for failed batches
  retryDelay: 1000, // Initial delay between retries (doubles each attempt)
};

export const CACHE_CONFIG = {
  summaryTTL: 300, // Cache summary data for 5 minutes
  metricsTTL: 3600, // Cache individual metrics for 1 hour
  maxEntries: 1000, // Maximum number of entries in the cache
};

export const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
};

export const ACCESS_CONTROL = {
  roles: {
    admin: ["all"],
    analyst: ["read", "export"],
    viewer: ["read"],
  },
};
