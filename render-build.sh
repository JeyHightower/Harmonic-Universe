#!/bin/bash

# Exit on error
set -e

npm install --prefix frontend &&
npm run build --prefix frontend &&
pip install -r requirements.txt &&
pip install psycopg2 &&
flask db upgrade &&
flask seed all 