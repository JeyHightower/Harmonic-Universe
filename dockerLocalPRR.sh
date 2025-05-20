# Verify current directory
cd /Users/jameshightower/Desktop/AppAcademy/capstone/projects/Harmonic-Universe
pwd

# Find and stop all running processes
lsof -i :5001 | grep LISTEN
lsof -i :5173 | grep LISTEN
lsof -i :5174 | grep LISTEN
pkill -f flask
pkill -f vite

# Prune local environment
echo "Cleaning frontend..."
cd frontend
rm -rf node_modules/.vite
rm -rf dist
npm cache clean --force

echo "Cleaning backend..."
cd ../backend
find . -name "__pycache__" -type d -exec rm -rf {} +
find . -name "*.pyc" -delete
rm -f logs/*.log

# Prune Docker if using Docker
cd ..
docker ps
docker stop $(docker ps -a -q) 2>/dev/null || true
docker system prune -af --volumes

# Rebuild application
echo "Rebuilding frontend..."
cd frontend
npm ci
npm run build

echo "Rebuilding backend..."
cd ../backend
source venv/bin/activate
pip install -r requirements.txt

# Restart services
echo "Starting backend..."
cd ../backend
source venv/bin/activate
flask run --host=0.0.0.0 --port=5001 &

echo "Starting frontend..."
cd ../frontend
npm run dev

# Optional: If using Docker instead of running locally
# cd ..
# docker-compose up --build
