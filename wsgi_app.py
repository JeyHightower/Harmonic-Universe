#!/usr/bin/env python
from app import create_app
from port import get_port

# Create the application
application = create_app()

if __name__ == "__main__":
    # Run the application
    port = get_port()
    application.run(host="0.0.0.0", port=port, debug=True)
