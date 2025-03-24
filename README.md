# Harmonic Universe

A web application that allows users to create and explore musical universes based on physics principles.

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