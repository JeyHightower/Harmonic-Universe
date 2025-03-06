#!/usr/bin/env python
from app import create_app

# Create the application
app = create_app()

if __name__ == "__main__":
    # Run the application
    app.run(host="0.0.0.0", port=8000, debug=True)
