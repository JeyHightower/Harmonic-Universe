import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import http from 'k6/http';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test data
const users = new SharedArray('users', function () {
  return Array(100)
    .fill()
    .map((_, i) => ({
      email: `test${i}@example.com`,
      password: 'password123',
    }));
});

const universeNames = new SharedArray('universeNames', function () {
  return Array(50)
    .fill()
    .map((_, i) => `Test Universe ${i}`);
});

// Default configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.1'],
  },
};

// Helper functions
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getAuthToken() {
  const user = randomItem(users);
  const loginRes = http.post('http://localhost:5001/api/auth/login', {
    email: user.email,
    password: user.password,
  });

  check(loginRes, {
    'login successful': r => r.status === 200 && r.json('token'),
  });

  return loginRes.json('token');
}

// Test scenarios
export function setup() {
  // Create test users if they don't exist
  users.forEach(user => {
    http.post('http://localhost:5001/api/auth/register', {
      email: user.email,
      password: user.password,
      username: user.email.split('@')[0],
    });
  });
}

export default function () {
  const token = getAuthToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Test universe listing
  const listRes = http.get('http://localhost:5001/api/universes', { headers });
  check(listRes, {
    'list universes successful': r => r.status === 200,
    'list response time OK': r => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // Test universe creation
  const createRes = http.post('http://localhost:5001/api/universes', {
    headers,
    json: {
      name: randomItem(universeNames),
      description: 'Load test universe',
      isPublic: true,
    },
  });

  check(createRes, {
    'create universe successful': r => r.status === 201,
    'create response time OK': r => r.timings.duration < 1000,
  }) || errorRate.add(1);

  if (createRes.status === 201) {
    const universeId = createRes.json('id');

    // Test universe detail
    const detailRes = http.get(
      `http://localhost:5001/api/universes/${universeId}`,
      { headers }
    );
    check(detailRes, {
      'get universe successful': r => r.status === 200,
      'get response time OK': r => r.timings.duration < 500,
    }) || errorRate.add(1);

    sleep(1);

    // Test universe update
    const updateRes = http.put(
      `http://localhost:5001/api/universes/${universeId}`,
      {
        headers,
        json: {
          name: `Updated ${randomItem(universeNames)}`,
          description: 'Updated load test universe',
          isPublic: true,
        },
      }
    );

    check(updateRes, {
      'update universe successful': r => r.status === 200,
      'update response time OK': r => r.timings.duration < 1000,
    }) || errorRate.add(1);

    sleep(1);

    // Test universe deletion
    const deleteRes = http.del(
      `http://localhost:5001/api/universes/${universeId}`,
      { headers }
    );
    check(deleteRes, {
      'delete universe successful': r => r.status === 204,
      'delete response time OK': r => r.timings.duration < 500,
    }) || errorRate.add(1);
  }

  sleep(2);
}
