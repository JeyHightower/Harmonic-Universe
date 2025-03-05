import os
import json
import time
import threading
import datetime
import psutil
import requests
from flask import Flask, render_template, jsonify

# Create Flask app for the dashboard
app = Flask(__name__, template_folder='monitor_templates')

# Store metrics
metrics = {
    'system': {
        'cpu': [],
        'memory': [],
        'disk': [],
    },
    'application': {
        'response_times': [],
        'error_count': 0,
        'request_count': 0,
    },
    'endpoints': {},
    'history': [],
}

# Configuration
MAX_HISTORY = 1000  # Maximum number of data points to keep
APP_URL = os.environ.get('APP_URL', 'https://harmonic-universe.onrender.com')
ENDPOINTS = [
    '/',
    '/api/health',
    '/test.html',
]
POLL_INTERVAL = 30  # seconds

def collect_metrics():
    """Collect system and application metrics"""
    while True:
        try:
            # System metrics
            metrics['system']['cpu'].append({
                'time': datetime.datetime.now().isoformat(),
                'value': psutil.cpu_percent()
            })

            metrics['system']['memory'].append({
                'time': datetime.datetime.now().isoformat(),
                'value': psutil.virtual_memory().percent
            })

            metrics['system']['disk'].append({
                'time': datetime.datetime.now().isoformat(),
                'value': psutil.disk_usage('/').percent
            })

            # Application metrics
            for endpoint in ENDPOINTS:
                url = f"{APP_URL}{endpoint}"
                try:
                    start_time = time.time()
                    response = requests.get(url, timeout=10)
                    response_time = time.time() - start_time

                    # Store endpoint metrics
                    if endpoint not in metrics['endpoints']:
                        metrics['endpoints'][endpoint] = {
                            'response_times': [],
                            'status_codes': {},
                            'errors': 0,
                            'requests': 0,
                        }

                    metrics['endpoints'][endpoint]['response_times'].append({
                        'time': datetime.datetime.now().isoformat(),
                        'value': response_time
                    })

                    status_code = str(response.status_code)
                    if status_code not in metrics['endpoints'][endpoint]['status_codes']:
                        metrics['endpoints'][endpoint]['status_codes'][status_code] = 0
                    metrics['endpoints'][endpoint]['status_codes'][status_code] += 1

                    metrics['endpoints'][endpoint]['requests'] += 1
                    metrics['application']['request_count'] += 1

                    # Record content size
                    content_size = len(response.content)

                    # Log to history
                    metrics['history'].append({
                        'time': datetime.datetime.now().isoformat(),
                        'endpoint': endpoint,
                        'status': response.status_code,
                        'response_time': response_time,
                        'size': content_size
                    })

                except Exception as e:
                    if endpoint not in metrics['endpoints']:
                        metrics['endpoints'][endpoint] = {
                            'response_times': [],
                            'status_codes': {},
                            'errors': 0,
                            'requests': 0,
                        }

                    metrics['endpoints'][endpoint]['errors'] += 1
                    metrics['application']['error_count'] += 1

                    # Log to history
                    metrics['history'].append({
                        'time': datetime.datetime.now().isoformat(),
                        'endpoint': endpoint,
                        'status': 'error',
                        'response_time': 0,
                        'error': str(e)
                    })

            # Limit data points to prevent memory issues
            for key in metrics['system']:
                if len(metrics['system'][key]) > MAX_HISTORY:
                    metrics['system'][key] = metrics['system'][key][-MAX_HISTORY:]

            for endpoint in metrics['endpoints']:
                if len(metrics['endpoints'][endpoint]['response_times']) > MAX_HISTORY:
                    metrics['endpoints'][endpoint]['response_times'] = metrics['endpoints'][endpoint]['response_times'][-MAX_HISTORY:]

            if len(metrics['history']) > MAX_HISTORY:
                metrics['history'] = metrics['history'][-MAX_HISTORY:]

        except Exception as e:
            print(f"Error collecting metrics: {str(e)}")

        time.sleep(POLL_INTERVAL)

# Start metrics collection in a background thread
metrics_thread = threading.Thread(target=collect_metrics, daemon=True)
metrics_thread.start()

@app.route('/')
def index():
    """Render dashboard page"""
    return render_template('dashboard.html', app_url=APP_URL)

@app.route('/api/metrics')
def get_metrics():
    """Return current metrics as JSON"""
    return jsonify(metrics)

if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    os.makedirs('monitor_templates', exist_ok=True)

    # Create dashboard HTML template
    with open('monitor_templates/dashboard.html', 'w') as f:
        f.write('''<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe Monitoring</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; color: #333; }
        .dashboard { max-width: 1200px; margin: 0 auto; }
        .card { background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 20px; margin-bottom: 20px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        h1, h2, h3 { margin-top: 0; }
        .chart-container { height: 200px; }
        table { width: 100%; border-collapse: collapse; }
        table th, table td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
        table tr:nth-child(even) { background-color: #f9f9f9; }
        .status-ok { color: green; }
        .status-error { color: red; }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="dashboard">
        <h1>Harmonic Universe Monitoring Dashboard</h1>
        <p>Monitoring application at: <a href="{{ app_url }}" target="_blank">{{ app_url }}</a></p>

        <div class="card">
            <h2>System Overview</h2>
            <div class="metrics-grid">
                <div>
                    <h3>CPU Usage</h3>
                    <div class="chart-container">
                        <canvas id="cpuChart"></canvas>
                    </div>
                </div>
                <div>
                    <h3>Memory Usage</h3>
                    <div class="chart-container">
                        <canvas id="memoryChart"></canvas>
                    </div>
                </div>
                <div>
                    <h3>Disk Usage</h3>
                    <div class="chart-container">
                        <canvas id="diskChart"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>Application Metrics</h2>
            <div class="metrics-grid">
                <div>
                    <h3>Total Requests</h3>
                    <div id="totalRequests" style="font-size: 24px; font-weight: bold;"></div>
                </div>
                <div>
                    <h3>Error Count</h3>
                    <div id="errorCount" style="font-size: 24px; font-weight: bold;"></div>
                </div>
                <div>
                    <h3>Error Rate</h3>
                    <div id="errorRate" style="font-size: 24px; font-weight: bold;"></div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>Endpoint Performance</h2>
            <div id="endpointCharts"></div>
        </div>

        <div class="card">
            <h2>Recent Requests</h2>
            <table id="historyTable">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Endpoint</th>
                        <th>Status</th>
                        <th>Response Time</th>
                        <th>Size</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </div>

    <script>
        // Charts
        const cpuChart = new Chart(document.getElementById('cpuChart').getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'CPU Usage (%)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgb(54, 162, 235)',
                    data: []
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        const memoryChart = new Chart(document.getElementById('memoryChart').getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Memory Usage (%)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgb(255, 99, 132)',
                    data: []
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        const diskChart = new Chart(document.getElementById('diskChart').getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Disk Usage (%)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgb(75, 192, 192)',
                    data: []
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        const endpointCharts = {};

        // Update metrics every 10 seconds
        function updateMetrics() {
            fetch('/api/metrics')
                .then(response => response.json())
                .then(data => {
                    // Update system metrics
                    updateSystemCharts(data.system);

                    // Update application metrics
                    document.getElementById('totalRequests').textContent = data.application.request_count;
                    document.getElementById('errorCount').textContent = data.application.error_count;

                    const errorRate = data.application.request_count > 0
                        ? ((data.application.error_count / data.application.request_count) * 100).toFixed(2) + '%'
                        : '0%';
                    document.getElementById('errorRate').textContent = errorRate;

                    // Update endpoint charts
                    updateEndpointCharts(data.endpoints);

                    // Update history table
                    updateHistoryTable(data.history);
                })
                .catch(error => console.error('Error fetching metrics:', error));
        }

        function updateSystemCharts(system) {
            // Update CPU chart
            if (system.cpu.length > 0) {
                cpuChart.data.labels = system.cpu.slice(-20).map(item => formatTime(item.time));
                cpuChart.data.datasets[0].data = system.cpu.slice(-20).map(item => item.value);
                cpuChart.update();
            }

            // Update memory chart
            if (system.memory.length > 0) {
                memoryChart.data.labels = system.memory.slice(-20).map(item => formatTime(item.time));
                memoryChart.data.datasets[0].data = system.memory.slice(-20).map(item => item.value);
                memoryChart.update();
            }

            // Update disk chart
            if (system.disk.length > 0) {
                diskChart.data.labels = system.disk.slice(-20).map(item => formatTime(item.time));
                diskChart.data.datasets[0].data = system.disk.slice(-20).map(item => item.value);
                diskChart.update();
            }
        }

        function updateEndpointCharts(endpoints) {
            const container = document.getElementById('endpointCharts');

            // Create charts for each endpoint if they don't exist
            for (const endpoint in endpoints) {
                if (!endpointCharts[endpoint]) {
                    // Create container for this endpoint
                    const endpointDiv = document.createElement('div');
                    endpointDiv.innerHTML = `
                        <h3>${endpoint}</h3>
                        <div class="chart-container">
                            <canvas id="chart-${endpoint.replace(/\//g, '-')}"></canvas>
                        </div>
                    `;
                    container.appendChild(endpointDiv);

                    // Create chart
                    const canvas = document.getElementById(`chart-${endpoint.replace(/\//g, '-')}`);
                    endpointCharts[endpoint] = new Chart(canvas.getContext('2d'), {
                        type: 'line',
                        data: {
                            labels: [],
                            datasets: [{
                                label: 'Response Time (s)',
                                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                                borderColor: 'rgb(153, 102, 255)',
                                data: []
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false
                        }
                    });
                }

                // Update the chart
                const responseTimes = endpoints[endpoint].response_times;
                if (responseTimes.length > 0) {
                    endpointCharts[endpoint].data.labels = responseTimes.slice(-20).map(item => formatTime(item.time));
                    endpointCharts[endpoint].data.datasets[0].data = responseTimes.slice(-20).map(item => item.value);
                    endpointCharts[endpoint].update();
                }
            }
        }

        function updateHistoryTable(history) {
            const tableBody = document.querySelector('#historyTable tbody');
            tableBody.innerHTML = '';

            // Display the 20 most recent requests, newest first
            history.slice(-20).reverse().forEach(item => {
                const row = document.createElement('tr');

                // Format status class
                const statusClass = item.status === 'error' || (typeof item.status === 'number' && item.status >= 400)
                    ? 'status-error'
                    : 'status-ok';

                row.innerHTML = `
                    <td>${formatTime(item.time)}</td>
                    <td>${item.endpoint}</td>
                    <td class="${statusClass}">${item.status}</td>
                    <td>${item.response_time.toFixed(3)}s</td>
                    <td>${item.size !== undefined ? formatBytes(item.size) : '-'}</td>
                `;
                tableBody.appendChild(row);
            });
        }

        function formatTime(isoTime) {
            const date = new Date(isoTime);
            return date.toLocaleTimeString();
        }

        function formatBytes(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        // Initial update and set interval
        updateMetrics();
        setInterval(updateMetrics, 10000);
    </script>
</body>
</html>''')

    # Start the dashboard
    app.run(host='0.0.0.0', port=5000, debug=True)
