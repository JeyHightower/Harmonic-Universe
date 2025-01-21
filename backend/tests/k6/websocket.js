import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import http from 'k6/http';
import { Rate } from 'k6/metrics';
import ws from 'k6/ws';

// Custom metrics
const wsConnectErrors = new Rate('ws_connect_errors');
const wsMessageErrors = new Rate('ws_message_errors');
const wsLatency = new Rate('ws_message_latency');

// Test data
const users = new SharedArray('users', function () {
  return Array(100)
    .fill()
    .map((_, i) => ({
      email: `test${i}@example.com`,
      password: 'password123',
    }));
});

// Default configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 10 }, // Stay at 10 users
    { duration: '30s', target: 0 }, // Ramp down
  ],
  thresholds: {
    ws_connect_errors: ['rate<0.1'], // Less than 10% connection errors
    ws_message_errors: ['rate<0.05'], // Less than 5% message errors
    ws_message_latency: ['p(95)<100'], // 95% of messages should be processed within 100ms
  },
};

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

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

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
  const url = `ws://localhost:5001/ws?token=${token}`;

  const response = ws.connect(url, {}, function (socket) {
    // Connection successful
    check(socket, {
      'Connected successfully': socket => socket.readyState === 1,
    }) || wsConnectErrors.add(1);

    // Join a room
    socket.send(
      JSON.stringify({
        type: 'join_room',
        room: 'test-room',
      })
    );

    // Send multiple messages
    for (let i = 0; i < 10; i++) {
      const startTime = Date.now();
      const messageId = `msg_${startTime}_${i}`;

      socket.send(
        JSON.stringify({
          type: 'message',
          room: 'test-room',
          content: `Test message ${i}`,
          id: messageId,
          timestamp: startTime,
        })
      );

      // Handle message acknowledgment
      socket.on('message', data => {
        const message = JSON.parse(data);
        if (message.type === 'ack' && message.id === messageId) {
          const latency = Date.now() - startTime;
          wsLatency.add(latency);

          check(latency, {
            'Message latency within limits': l => l < 100,
          }) || wsMessageErrors.add(1);
        }
      });

      sleep(0.1); // Wait 100ms between messages
    }

    // Test batch message processing
    const batchStartTime = Date.now();
    const batchMessages = Array(50)
      .fill()
      .map((_, i) => ({
        type: 'message',
        room: 'test-room',
        content: `Batch message ${i}`,
        id: `batch_${batchStartTime}_${i}`,
        timestamp: batchStartTime,
      }));

    socket.send(
      JSON.stringify({
        type: 'batch',
        messages: batchMessages,
      })
    );

    // Handle batch acknowledgment
    socket.on('message', data => {
      const message = JSON.parse(data);
      if (message.type === 'batch_ack') {
        const batchLatency = Date.now() - batchStartTime;
        check(batchLatency, {
          'Batch processing within limits': l => l < 1000,
        }) || wsMessageErrors.add(1);
      }
    });

    // Test error handling
    socket.send(
      JSON.stringify({
        type: 'invalid_message_type',
        content: 'This should trigger an error',
      })
    );

    socket.on('error', () => {
      wsMessageErrors.add(1);
    });

    // Stay connected for a while to simulate real usage
    sleep(5);

    // Leave room before disconnecting
    socket.send(
      JSON.stringify({
        type: 'leave_room',
        room: 'test-room',
      })
    );
  });

  // Check if connection was successful
  check(response, {
    'Status is 101': r => r && r.status === 101,
  });

  sleep(1);
}
