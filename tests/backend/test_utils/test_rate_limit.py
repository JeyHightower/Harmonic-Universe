import pytest
from flask import jsonify
from app.utils.rate_limit import rate_limit, cache_response
import time
from unittest.mock import patch, MagicMock
import redis

@pytest.fixture
def mock_redis():
    """Mock Redis client for testing"""
    with patch('app.utils.rate_limit.redis_client') as mock_client:
        yield mock_client

def test_rate_limit_under_limit(app, mock_redis):
    """Test rate limiting when under the limit"""
    with app.app_context():
        # Create a test endpoint with rate limiting
        @app.route('/test_rate')
        @rate_limit(limit=2, per=60)
        def rate_limited_endpoint():
            return jsonify({'message': 'success'})

        # Configure mock Redis
        mock_redis.get.return_value = b'1'  # Return bytes as Redis would
        mock_redis.pipeline.return_value.execute.return_value = [2, True]  # incr and expire results

        # Create test client
        client = app.test_client()

        # Test request
        response = client.get('/test_rate')
        assert response.status_code == 200
        assert response.json['message'] == 'success'

def test_rate_limit_exceeded(app, mock_redis):
    """Test rate limiting when limit is exceeded"""
    with app.app_context():
        # Create a test endpoint with rate limiting
        @app.route('/test_rate_exceed')
        @rate_limit(limit=2, per=60)
        def rate_limited_endpoint():
            return jsonify({'message': 'success'})

        # Configure mock Redis to show limit exceeded
        mock_redis.get.return_value = b'2'  # Already at limit

        # Create test client
        client = app.test_client()

        # Test request
        response = client.get('/test_rate_exceed')
        assert response.status_code == 429
        assert response.json['error'] == 'Rate limit exceeded'

def test_rate_limit_redis_error(app, mock_redis):
    """Test rate limiting when Redis fails"""
    with app.app_context():
        # Create a test endpoint with rate limiting
        @app.route('/test_rate_error')
        @rate_limit(limit=2, per=60)
        def rate_limited_endpoint():
            return jsonify({'message': 'success'})

        # Configure mock Redis to raise an exception
        mock_redis.get.side_effect = redis.RedisError("Connection error")

        # Create test client
        client = app.test_client()

        # Test request - should fail open
        response = client.get('/test_rate_error')
        assert response.status_code == 200
        assert response.json['message'] == 'success'

def test_rate_limit_first_request(app, mock_redis):
    """Test rate limiting for first request (no existing count)"""
    with app.app_context():
        # Create a test endpoint with rate limiting
        @app.route('/test_rate_first')
        @rate_limit(limit=2, per=60)
        def rate_limited_endpoint():
            return jsonify({'message': 'success'})

        # Configure mock Redis for first request
        mock_redis.get.return_value = None
        mock_redis.pipeline.return_value.execute.return_value = [1, True]  # First increment

        # Create test client
        client = app.test_client()

        # Test request
        response = client.get('/test_rate_first')
        assert response.status_code == 200
        assert response.json['message'] == 'success'

@pytest.fixture
def mock_cache():
    """Mock cache for testing"""
    with patch('app.utils.rate_limit.cache') as mock_cache:
        yield mock_cache

def test_cache_response_hit(app, mock_cache):
    """Test cached response when cache hit"""
    with app.app_context():
        # Create a test endpoint with caching
        @app.route('/test_cache')
        @cache_response(timeout=300)
        def cached_endpoint():
            return jsonify({'message': 'success', 'timestamp': time.time()})

        # Configure mock cache to return a cached response
        cached_response = {'message': 'success', 'timestamp': time.time()}
        mock_cache.get.return_value = cached_response

        # Create test client
        client = app.test_client()

        # Test request
        response = client.get('/test_cache')
        assert response == cached_response  # Should return cached response
        mock_cache.set.assert_not_called()  # Should not set cache

def test_cache_response_miss(app, mock_cache):
    """Test cached response when cache miss"""
    with app.app_context():
        # Create a test endpoint with caching
        @app.route('/test_cache_miss')
        @cache_response(timeout=300)
        def cached_endpoint():
            return jsonify({'message': 'success', 'timestamp': time.time()})

        # Configure mock cache to simulate cache miss
        mock_cache.get.return_value = None

        # Create test client
        client = app.test_client()

        # Test request
        response = client.get('/test_cache_miss')
        assert response.status_code == 200
        assert 'message' in response.json
        assert 'timestamp' in response.json

        # Verify cache was set
        mock_cache.set.assert_called_once()

def test_cache_response_with_args(app, mock_cache):
    """Test cached response with different arguments"""
    with app.app_context():
        # Create a test endpoint with caching and parameters
        @app.route('/test_cache/<param>')
        @cache_response(timeout=300)
        def cached_endpoint(param):
            return jsonify({'message': 'success', 'param': param})

        # Configure mock cache
        mock_cache.get.return_value = None

        # Create test client
        client = app.test_client()

        # Test requests with different parameters
        response1 = client.get('/test_cache/param1')
        response2 = client.get('/test_cache/param2')

        assert response1.status_code == 200
        assert response2.status_code == 200
        assert response1.json['param'] == 'param1'
        assert response2.json['param'] == 'param2'

        # Verify cache was set twice with different keys
        assert mock_cache.set.call_count == 2
