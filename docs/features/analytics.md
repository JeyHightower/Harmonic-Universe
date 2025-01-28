# Analytics API Documentation

## Overview

The Analytics API provides endpoints for tracking and retrieving application metrics, including PWA usage, performance data, and error tracking.

## Base URL

```
/api/analytics
```

## Endpoints

### Track Analytics

Record a new analytics metric.

```http
POST /api/analytics
```

#### Request Body

```json
{
  "name": "string",       // Metric name
  "value": number,        // Metric value
  "timestamp": number,    // Unix timestamp in milliseconds
  "tags": {              // Optional metadata
    "type": "string",
    "environment": "string",
    "platform": "string"
  }
}
```

#### Response

```json
{
  "message": "Analytics recorded successfully",
  "id": "string"
}
```

#### Status Codes

- `201`: Analytics recorded successfully
- `400`: Missing required fields
- `500`: Server error

### Get Analytics Summary

Retrieve aggregated analytics data for the last 24 hours.

```http
GET /api/analytics/summary
```

#### Response

```json
{
  "summary": {
    "metric_name": {
      "total": number,
      "count": number,
      "min": number,
      "max": number,
      "average": number,
      "tags": {
        "tag_name": {
          "tag_value": number
        }
      }
    }
  },
  "total_metrics": number,
  "unique_metrics": number,
  "generated_at": "string"  // ISO 8601 timestamp
}
```

#### Status Codes

- `200`: Success
- `500`: Server error

## Metric Types

### PWA Metrics

- `pwa_install`: PWA installation events
- `pwa_update`: PWA update events
- `pwa_offline_usage`: Offline usage duration

### Service Worker Metrics

- `sw_registration`: Service worker registration events
- `sw_error`: Service worker errors
- `cache_hit`: Cache hit events
- `cache_miss`: Cache miss events

### Performance Metrics

- `performance_first-contentful-paint`: First Contentful Paint
- `performance_largest-contentful-paint`: Largest Contentful Paint
- `performance_first-input-delay`: First Input Delay
- `performance_cumulative-layout-shift`: Cumulative Layout Shift
- `performance_time-to-interactive`: Time to Interactive

### Sync Metrics

- `sync_attempt`: Background sync attempts
- `sync_success`: Successful sync events
- `sync_error`: Failed sync events

## Tag Types

### Common Tags

- `type`: Event type (e.g., "performance", "error", "event")
- `environment`: Application environment (e.g., "production", "development")
- `platform`: User platform (e.g., "ios", "android", "desktop")

### Error Tags

- `error`: Error message
- `stack`: Error stack trace
- `component`: Component where error occurred

### Performance Tags

- `browser`: Browser name and version
- `connection`: Network connection type
- `memory`: Available memory

## Examples

### Track PWA Installation

```http
POST /api/analytics
Content-Type: application/json

{
  "name": "pwa_install",
  "value": 1,
  "timestamp": 1647432000000,
  "tags": {
    "type": "event",
    "platform": "android",
    "outcome": "success"
  }
}
```

### Track Performance Metric

```http
POST /api/analytics
Content-Type: application/json

{
  "name": "performance_first-contentful-paint",
  "value": 1200,
  "timestamp": 1647432000000,
  "tags": {
    "type": "performance",
    "browser": "chrome",
    "connection": "4g"
  }
}
```

### Track Error

```http
POST /api/analytics
Content-Type: application/json

{
  "name": "sw_error",
  "value": 1,
  "timestamp": 1647432000000,
  "tags": {
    "type": "error",
    "event": "registration",
    "error": "Failed to register service worker"
  }
}
```

## Rate Limiting

- 100 requests per minute per IP for POST requests
- 30 requests per minute per IP for GET requests

## Caching

- Summary endpoint responses are cached for 5 minutes
- Cache is invalidated when new metrics are recorded

## Error Handling

All errors follow this format:

```json
{
  "error": "string"
}
```

Common error messages:

- `"Missing required fields"`: Request body is missing required fields
- `"Invalid metric value"`: Metric value is not a number
- `"Invalid timestamp"`: Timestamp is not a valid number
- `"Rate limit exceeded"`: Too many requests
- `"Internal server error"`: Server-side error
