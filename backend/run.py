import os
from app import create_app

# Create app instance with appropriate configuration
is_testing = os.environ.get('TEST_PORT') is not None
app = create_app(test_config={
    'TESTING': True,
    'DEBUG': True
} if is_testing else None)

if __name__ == '__main__':
    # Use TEST_PORT if available, otherwise fall back to PORT or 10000
    port = int(os.environ.get('TEST_PORT') or os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port, debug=True)
