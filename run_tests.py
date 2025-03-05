import unittest
import sys
import os
import coverage

# Set up code coverage
cov = coverage.Coverage(
    branch=True,
    include='app.py,wsgi.py',
    omit=['tests/*', 'migrations/*', 'static/*']
)
cov.start()

# Find and run all tests
test_loader = unittest.TestLoader()
test_suite = test_loader.discover('tests', pattern='test_*.py')

# Run tests
result = unittest.TextTestRunner(verbosity=2).run(test_suite)

# Stop coverage and generate report
cov.stop()
cov.save()
cov.report()

# Save HTML report
os.makedirs('coverage_reports', exist_ok=True)
cov.html_report(directory='coverage_reports')

# Exit with status code
sys.exit(not result.wasSuccessful())
