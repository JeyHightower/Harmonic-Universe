# Monitoring Setup Guide

## Overview

This guide covers the setup and configuration of monitoring for Harmonic Universe, including PWA metrics, performance tracking, error reporting, and analytics.

## Components

### 1. Frontend Monitoring Service

The monitoring service tracks:

- PWA lifecycle events
- Performance metrics
- Error events
- Service worker status
- Network conditions
- User interactions

#### Setup

1. Import the monitoring service:

```javascript
import { monitoring } from '@/services/monitoring';
```

2. Initialize monitoring:

```javascript
monitoring.init({
  appVersion: process.env.VITE_APP_VERSION,
  environment: process.env.NODE_ENV,
  analyticsEndpoint: '/api/analytics',
});
```

3. Start tracking:

```javascript
monitoring.startTracking();
```

### 2. Backend Analytics Service

Handles storage and aggregation of metrics.

#### Database Setup

1. Create analytics tables:

```sql
CREATE TABLE analytics (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  value NUMERIC NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  tags JSONB
);

CREATE INDEX idx_analytics_name ON analytics(name);
CREATE INDEX idx_analytics_timestamp ON analytics(timestamp);
CREATE INDEX idx_analytics_tags ON analytics USING gin(tags);
```

2. Configure environment variables:

```bash
ANALYTICS_DB_HOST=localhost
ANALYTICS_DB_PORT=5432
ANALYTICS_DB_NAME=harmonic_analytics
ANALYTICS_DB_USER=analytics_user
ANALYTICS_DB_PASSWORD=secure_password
```

### 3. Caching Layer

Redis setup for analytics caching:

1. Install Redis:

```bash
brew install redis  # macOS
sudo apt install redis-server  # Ubuntu
```

2. Configure environment variables:

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=secure_password
```

## Configuration

### 1. Metric Types

Configure which metrics to track in `monitoring.config.js`:

```javascript
export const METRICS = {
  PWA: {
    INSTALL: 'pwa_install',
    UPDATE: 'pwa_update',
    OFFLINE: 'pwa_offline_usage',
  },
  PERFORMANCE: {
    FCP: 'performance_first-contentful-paint',
    LCP: 'performance_largest-contentful-paint',
    FID: 'performance_first-input-delay',
    CLS: 'performance_cumulative-layout-shift',
    TTI: 'performance_time-to-interactive',
  },
  // ... other metric types
};
```

### 2. Sampling Rates

Configure sampling in `monitoring.config.js`:

```javascript
export const SAMPLING = {
  PERFORMANCE: 0.1, // 10% of users
  ERROR: 1.0, // 100% of errors
  ANALYTICS: 0.5, // 50% of analytics events
};
```

### 3. Retention Policies

Set up data retention in `analytics.config.js`:

```javascript
export const RETENTION = {
  RAW_METRICS: '30d', // Keep raw metrics for 30 days
  HOURLY_ROLLUPS: '90d', // Keep hourly summaries for 90 days
  DAILY_ROLLUPS: '365d', // Keep daily summaries for 1 year
};
```

## Usage

### 1. Track Custom Events

```javascript
monitoring.trackEvent('feature_usage', 1, {
  feature: 'universe_creation',
  outcome: 'success',
});
```

### 2. Track Errors

```javascript
monitoring.trackError(error, {
  component: 'UniverseEditor',
  action: 'save',
});
```

### 3. Track Performance

```javascript
monitoring.trackPerformance('custom_operation', duration, {
  type: 'database',
  operation: 'query',
});
```

## Dashboards

### 1. Analytics Dashboard

Access at `/analytics` with the following features:

- Real-time metrics
- Historical trends
- Error reports
- Performance data
- PWA statistics

### 2. Monitoring Dashboard

Access at `/monitoring` to view:

- Service health
- Error rates
- Performance metrics
- Cache statistics
- Background sync status

## Alerts

### 1. Configure Alert Rules

In `monitoring.alerts.js`:

```javascript
export const ALERT_RULES = {
  ERROR_RATE: {
    threshold: 0.05, // 5% error rate
    window: '5m', // Over 5 minutes
    cooldown: '15m', // Wait 15 minutes between alerts
  },
  PERFORMANCE: {
    lcp: 2500, // LCP threshold in ms
    fid: 100, // FID threshold in ms
    cls: 0.1, // CLS threshold
  },
};
```

### 2. Configure Alert Channels

In `monitoring.alerts.js`:

```javascript
export const ALERT_CHANNELS = {
  email: ['team@example.com'],
  slack: 'webhook_url',
  pagerduty: 'integration_key',
};
```

## Maintenance

### 1. Database Maintenance

Run periodically:

```bash
# Vacuum analytics tables
VACUUM ANALYZE analytics;

# Remove old data
DELETE FROM analytics
WHERE timestamp < NOW() - INTERVAL '30 days';
```

### 2. Cache Maintenance

Monitor and clear as needed:

```bash
# Clear analytics cache
redis-cli FLUSHDB

# Monitor cache size
redis-cli INFO memory
```

### 3. Log Rotation

Configure log rotation:

```bash
# /etc/logrotate.d/harmonic-monitoring
/var/log/harmonic/monitoring.log {
  daily
  rotate 7
  compress
  delaycompress
  notifempty
  create 0640 www-data www-data
}
```

## Troubleshooting

### 1. Missing Metrics

Check:

- Service worker status
- Network connectivity
- Sampling rates
- Browser support

### 2. High Error Rates

Investigate:

- Error patterns in logs
- Recent deployments
- Service dependencies
- Client environments

### 3. Performance Issues

Monitor:

- Database query times
- Cache hit rates
- Network latency
- Resource usage

## Security

### 1. Data Protection

- Encrypt sensitive data
- Implement access controls
- Regular security audits
- Secure API endpoints

### 2. Access Control

Configure in `monitoring.auth.js`:

```javascript
export const ACCESS_CONTROL = {
  roles: {
    admin: ['all'],
    analyst: ['read', 'export'],
    viewer: ['read'],
  },
  ips: ['10.0.0.0/8'],
};
```

## Best Practices

1. **Data Collection**

   - Collect only necessary data
   - Respect user privacy
   - Document data usage
   - Regular data cleanup

2. **Performance**

   - Use batch processing
   - Implement caching
   - Optimize queries
   - Monitor resource usage

3. **Maintenance**
   - Regular backups
   - Update dependencies
   - Monitor disk usage
   - Review alert rules

Last updated: Thu Jan 30 18:37:48 CST 2025
