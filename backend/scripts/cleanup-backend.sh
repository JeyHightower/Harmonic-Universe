#!/bin/bash

# Remove unnecessary directories and files
rm -rf src/
rm -rf docs/
rm -rf coverage_html_report/
rm -rf .pytest_cache/
rm -rf __pycache__/
rm -rf */__pycache__/
rm -rf flask_session/
rm -f coverage.xml
rm -f .coverage
rm -f run_tests.py
rm -f reset_db.py
rm -f create_db.py

# Create clean directory structure
mkdir -p app/models
mkdir -p app/routes
mkdir -p app/services
mkdir -p app/schemas
mkdir -p app/utils
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/fixtures

# Move core files to their proper locations
mv app/models/* app/models/
mv app/routes/* app/routes/
mv app/services/* app/services/
mv app/schemas/* app/schemas/
mv app/utils/* app/utils/

# Organize test files
mv tests/test_*.py tests/unit/
mv tests/integration_*.py tests/integration/
mv tests/fixtures/* tests/fixtures/

# Clean up empty directories
find . -type d -empty -delete

# Create clean test structure
cat > tests/conftest.py << 'EOL'
import pytest
from app import create_app
from app.models import db as _db
from config import TestConfig

@pytest.fixture(scope='session')
def app():
    app = create_app(TestConfig)
    return app

@pytest.fixture(scope='session')
def db(app):
    with app.app_context():
        _db.create_all()
        yield _db
        _db.drop_all()

@pytest.fixture(scope='function')
def session(db):
    connection = db.engine.connect()
    transaction = connection.begin()
    session = db.create_scoped_session()
    yield session
    session.close()
    transaction.rollback()
    connection.close()
EOL

# Update pytest.ini
cat > pytest.ini << 'EOL'
[pytest]
testpaths = tests
python_files = test_*.py
python_functions = test_*
addopts = -v --cov=app --cov-report=term-missing
markers =
    unit: Unit tests
    integration: Integration tests
    auth: Authentication tests
    universe: Universe management tests
    profile: Profile management tests
    favorites: Favorites management tests
    websocket: WebSocket service tests
    parameters: Parameter management tests
    privacy: Privacy control tests
EOL

# Update .coveragerc
cat > .coveragerc << 'EOL'
[run]
source = app
omit =
    */migrations/*
    */tests/*
    */__init__.py
    */config.py
    */wsgi.py

[report]
exclude_lines =
    pragma: no cover
    def __repr__
    raise NotImplementedError
    if __name__ == .__main__.:
    pass
    raise ImportError

[html]
directory = coverage_html_report
EOL

echo "Backend cleanup complete!"
