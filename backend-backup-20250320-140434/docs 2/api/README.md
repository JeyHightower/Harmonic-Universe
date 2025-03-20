# API Documentation

This directory contains the API documentation for the Harmonic Universe backend.

## Structure

The documentation is organized as follows:

- `endpoints/` - API endpoint documentation
- `models/` - Data model documentation
- `schemas/` - Request/response schema documentation

## Generation

Documentation is automatically generated using Sphinx. To generate the documentation:

1. Install the required dependencies:

   ```bash
   pip install -r docs/requirements.txt
   ```

2. Run the documentation generation:
   ```bash
   python scripts/initialize.py --generate-docs
   ```

The generated documentation will be available in the `docs/build/html` directory.
