#!/bin/bash

# Start the Flask application with Gunicorn
cd backend && gunicorn --worker-class eventlet -w 1 wsgi:app