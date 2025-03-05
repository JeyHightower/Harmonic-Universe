import time
import random
import concurrent.futures
import requests
import argparse
import matplotlib.pyplot as plt
import numpy as np
from collections import defaultdict

def make_request(url, session, request_id):
    """Make a request to the specified URL"""
    start_time = time.time()
    try:
        response = session.get(url, timeout=30)
        status_code = response.status_code
        response_time = time.time() - start_time
        content_length = len(response.content)
        return {
            'id': request_id,
            'url': url,
            'status_code': status_code,
            'response_time': response_time,
            'content_length': content_length,
            'success': 200 <= status_code < 400
        }
    except Exception as e:
        return {
            'id': request_id,
            'url': url,
            'status_code': 0,
            'response_time': time.time() - start_time,
            'content_length': 0,
            'success': False,
            'error': str(e)
        }

def run_load_test(base_url, endpoints, concurrency, requests_per_endpoint, ramp_up=0):
    """Run a load test against the specified endpoints"""
    print(f"Starting load test with {concurrency} concurrent users")
    print(f"Testing {len(endpoints)} endpoints with {requests_per_endpoint} requests each")

    # Prepare list of URLs to test
    urls = []
    for endpoint in endpoints:
        urls.extend([f"{base_url}{endpoint}" for _ in range(requests_per_endpoint)])

    # Shuffle to simulate real traffic patterns
    random.shuffle(urls)

    # Prepare results collection
    results = []
    session = requests.Session()

    # Run the load test
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        # Submit all tasks
        futures = []
        for i, url in enumerate(urls):
            # Implement ramp-up if requested
            if ramp_up > 0:
                time.sleep(ramp_up / len(urls))

            future = executor.submit(make_request, url, session, i)
            futures.append(future)

            # Print progress
            if (i + 1) % 100 == 0 or i + 1 == len(urls):
                print(f"Submitted {i + 1}/{len(urls)} requests")

        # Collect results as they complete
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())
            if len(results) % 100 == 0:
                print(f"Completed {len(results)}/{len(urls)} requests")

    return results

def analyze_results(results):
    """Analyze test results and print statistics"""
    if not results:
        print("No results to analyze")
        return

    # Basic stats
    total_requests = len(results)
    successful_requests = sum(1 for r in results if r['success'])
    failed_requests = total_requests - successful_requests
    success_rate = (successful_requests / total_requests) * 100 if total_requests > 0 else 0

    response_times = [r['response_time'] for r in results if r['success']]

    if not response_times:
        print("No successful requests to analyze")
        return

    avg_response_time = sum(response_times) / len(response_times)
    min_response_time = min(response_times)
    max_response_time = max(response_times)
    median_response_time = sorted(response_times)[len(response_times) // 2]

    p95_response_time = sorted(response_times)[int(len(response_times) * 0.95)]
    p99_response_time = sorted(response_times)[int(len(response_times) * 0.99)]

    # Endpoint-specific stats
    endpoint_stats = defaultdict(lambda: {'count': 0, 'success': 0, 'times': []})
    for r in results:
        endpoint = r['url'].split('/')[-1] if '/' in r['url'] else r['url']
        endpoint_stats[endpoint]['count'] += 1
        if r['success']:
            endpoint_stats[endpoint]['success'] += 1
            endpoint_stats[endpoint]['times'].append(r['response_time'])

    # Print results
    print("\n===== Load Test Results =====")
    print(f"Total Requests: {total_requests}")
    print(f"Successful Requests: {successful_requests} ({success_rate:.2f}%)")
    print(f"Failed Requests: {failed_requests}")
    print("\nResponse Time Statistics (seconds):")
    print(f"  Average: {avg_response_time:.6f}")
    print(f"  Minimum: {min_response_time:.6f}")
    print(f"  Maximum: {max_response_time:.6f}")
    print(f"  Median: {median_response_time:.6f}")
    print(f"  95th Percentile: {p95_response_time:.6f}")
    print(f"  99th Percentile: {p99_response_time:.6f}")

    print("\nEndpoint Statistics:")
    for endpoint, stats in endpoint_stats.items():
