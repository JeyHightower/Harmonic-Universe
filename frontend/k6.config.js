export default {
  // Base configuration for all k6 tests
  scenarios: {
    // Default scenario
    default: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 10 }, // Ramp up to 10 users over 30 seconds
        { duration: '1m', target: 10 }, // Stay at 10 users for 1 minute
        { duration: '30s', target: 0 }, // Ramp down to 0 users over 30 seconds
      ],
      gracefulRampDown: '30s',
    },
    // Stress test scenario
    stress: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '2m', target: 50 }, // Ramp up to 50 users over 2 minutes
        { duration: '3m', target: 50 }, // Stay at 50 users for 3 minutes
        { duration: '2m', target: 0 }, // Ramp down to 0 users over 2 minutes
      ],
      gracefulRampDown: '30s',
    },
    // Spike test scenario
    spike: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '10s', target: 100 }, // Quick ramp up to 100 users
        { duration: '1m', target: 100 }, // Stay at 100 users for 1 minute
        { duration: '10s', target: 0 }, // Quick ramp down to 0 users
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should complete within 500ms
    http_req_failed: ['rate<0.01'], // Less than 1% of requests should fail
  },
  // Configure batch size for WebSocket messages
  batchPerConnection: 10,
  // WebSocket connection parameters
  ws: {
    // Ping every 20 seconds to keep connection alive
    pingPongInterval: 20000,
    // Close connection if no pong received within 10 seconds
    pingTimeout: 10000,
  },
};
