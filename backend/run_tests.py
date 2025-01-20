import os
import sys
import pytest

def main():
    """Run the test suite."""
    # Set testing environment
    os.environ['FLASK_ENV'] = 'testing'
    os.environ['FLASK_CONFIG'] = 'testing'

    # Add application root to Python path
    app_root = os.path.abspath(os.path.dirname(__file__))
    sys.path.insert(0, app_root)

    # Configure test files to run
    test_files = [
        'tests/test_universe.py',
        'tests/test_physics.py',
        'tests/test_music.py',
        'tests/test_integration.py',
        'tests/test_auth.py',
        'tests/test_websocket.py'
    ]

    # Run tests with coverage
    pytest.main([
        '--verbose',
        '--cov=app',
        '--cov-report=term-missing',
        '--cov-report=html',
        '--cov-config=.coveragerc',
        '--asyncio-mode=strict',  # Strict mode for better async test handling
        '--capture=no',  # Show print statements and real-time output
        '-W', 'ignore::DeprecationWarning',  # Ignore deprecation warnings
    ] + test_files)

if __name__ == '__main__':
    main()
