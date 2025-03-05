#!/bin/bash

# Set the PYTHONPATH and start the Gunicorn server
PYTHONPATH=. gunicorn 'app:create_app()'
