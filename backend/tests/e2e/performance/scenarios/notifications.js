import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const notificationsFetchedRate = new Rate('notifications_fetched');
const notificationCreatedRate = new Rate('notifications_created');
const notificationLatencyTrend = new Trend('notification_latency');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 }, // Ramp up to 50 users
    { duration: '3m', target: 50 }, // Stay at 50 users
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '3m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    notifications_fetched: ['rate>0.95'], // 95% success rate
    notifications_created: ['rate>0.95'], // 95% success rate
    notification_latency: ['p95<500'], // 95% of requests under 500ms
    http_req_duration: ['p95<1000'], // 95% of requests under 1s
    http_req_failed: ['rate<0.05'], // Less than 5% failure rate
  },
};

// Simulated user session
export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:5000';
  const authToken = getAuthToken(); // You'll need to implement this

  const params = {
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  };

  // Get notifications
  const getNotificationsStart = Date.now();
  const getResponse = http.get(`${baseUrl}/api/notifications`, params);
  notificationLatencyTrend.add(Date.now() - getNotificationsStart);

  check(getResponse, {
    'notifications fetched successfully': r => r.status === 200,
  }) && notificationsFetchedRate.add(1);

  sleep(randomIntBetween(1, 5));

  // Create notification
  const createResponse = http.post(
    `${baseUrl}/api/notifications`,
    JSON.stringify({
      type: 'system',
      message: 'Load test notification',
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
      },
    }),
    params
  );

  check(createResponse, {
    'notification created successfully': r => r.status === 201,
  }) && notificationCreatedRate.add(1);

  sleep(randomIntBetween(1, 5));

  // Mark notification as read (if created successfully)
  if (createResponse.status === 201) {
    const notificationId = JSON.parse(createResponse.body).id;
    http.post(
      `${baseUrl}/api/notifications/${notificationId}/read`,
      null,
      params
    );
  }

  sleep(randomIntBetween(1, 5));
}

// Helper functions
function getAuthToken() {
  // Implement token generation/retrieval logic
  // This could be a pre-generated token for testing
  return 'test-token';
}
