# Harmonic Universe

A web application that allows users to create and explore musical universes based on physics principles.

## Project Structure

- **frontend/**: React frontend application
- **backend/**: Python Flask API

## Setup and Running

### Prerequisites

- Node.js (v18+)
- npm (v8+)
- Python 3.8+

### Starting the Application

1. **Clone the repository**

```bash
git clone <repository-url>
cd Harmonic-Universe
```

2. **Install dependencies**

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

3. **Run the application**

```bash
# Start both frontend and backend
npm start
```

This will:

- Start the backend Flask API on port 5001
- Start the frontend development server on port 5175 (or another available port)

4. **Access the application**

Open your browser and go to:

- Frontend: http://localhost:5175
- Backend API: http://localhost:5001

## Troubleshooting

### Backend Not Starting

If you encounter issues with the backend not starting:

1. Make sure Python and required packages are installed
2. Try running the backend directly:

```bash
cd backend
python simple_app.py
```

### Frontend Not Loading Data

If the frontend loads but doesn't show any data:

1. Check browser console for errors
2. Verify the backend is running by visiting http://localhost:5001/api/health
3. Refresh the page and clear browser cache if needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.
