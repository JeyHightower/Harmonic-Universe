# Harmonic Universe

A full-stack application for creating and managing harmonic universes.

## Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- pip (Python package manager)
- npm (Node package manager)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/JeyHightower/Harmonic-Universe.git
cd Harmonic-Universe
```

2. Install all dependencies:

```bash
npm run install-all
```

This will install:

- Frontend dependencies (npm packages)
- Backend dependencies (Python packages)

## Development

To run both frontend and backend servers in development mode:

```bash
npm start
```

This will start:

- Frontend development server (Vite)
- Backend Flask server on port 5001

## Production

To run the application in production mode:

```bash
npm run start:prod
```

This will:

1. Build the frontend
2. Start the frontend preview server
3. Start the backend with Gunicorn

## Available Commands

- `npm start` - Run both servers in development mode
- `npm run start:prod` - Run both servers in production mode
- `npm run backend` - Run only the backend server
- `npm run frontend` - Run only the frontend development server
- `npm run build` - Build the frontend for production
- `npm test` - Run backend tests

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
FLASK_APP=backend/app
FLASK_ENV=development
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
```

## Project Structure

```
harmonic-universe/
├── frontend/           # React frontend
│   ├── src/           # Source files
│   ├── public/        # Static files
│   └── package.json   # Frontend dependencies
├── backend/           # Flask backend
│   ├── app/          # Application code
│   └── requirements.txt # Backend dependencies
└── package.json      # Root package.json
```

## Project Structure

- `frontend/`: React frontend application
- `backend/`: Python Flask API
- `docs/`: Project documentation
- `scripts/`: Utility scripts

## Setup and Running

### Prerequisites

- Node.js (v18+)
- npm (v8+)
- Python 3.8+

### Starting the Application

1. **Clone the repository**

```bash
git clone https://github.com/JeyHightower/Harmonic-Universe.git
cd Harmonic-Universe
```

2. **Install dependencies**

```bash
# Install frontend dependencies
cd frontend
npm install
cd ..

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
- Start the frontend development server on port 5175

4. **Access the application**

- Frontend: http://localhost:5175
- Backend API: http://localhost:5001

## Development

### Frontend Development

```bash
cd frontend
npm run dev
```

### Backend Development

```bash
cd backend
python app.py
```

## Testing

### Frontend Tests

```bash
cd frontend
npm test
```

### Backend Tests

```bash
cd backend
pytest
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
