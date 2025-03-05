# Install Python dependencies
pip install -r backend/requirements.txt
pip install gunicorn

# Build the React frontend
cd frontend && npm install && npm run render-build

# Copy built frontend to Flask static directory
cd ..
mkdir -p static
cp -r frontend/dist/* static/
chmod -R 755 static/

# Make sure the polyfill scripts are copied
cp frontend/public/react-polyfill.js static/ 2>/dev/null || true
cp frontend/public/react-context-provider.js static/ 2>/dev/null || true
