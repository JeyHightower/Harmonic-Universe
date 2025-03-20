# Harmonic Universe

A web application for creating and sharing universes with AI-generated content.

## Project Structure

- `frontend/` - React frontend application
- `backend/` - Flask API backend
- `scripts/` - Utility scripts for development and deployment
- `docs/` - Project documentation

## Getting Started

### Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- npm or yarn
- pip

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The backend server will start at http://localhost:5001

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

The frontend development server will start at http://localhost:3000

## Deployment

This project is configured for deployment on Render.com.
See the deployment instructions in the `docs/deployment.md` file.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
