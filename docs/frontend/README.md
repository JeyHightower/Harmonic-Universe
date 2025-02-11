# Harmonic Universe

A modern web application for music collaboration and creation.

## Project Structure

```
.
├── backend/           # FastAPI backend service
├── frontend/         # React frontend application
└── root/             # Project-level configuration and documentation
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.9 or higher)
- PostgreSQL
- Docker (optional)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/harmonic-universe.git
cd harmonic-universe
```

2. Set up the backend:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up the frontend:

```bash
cd frontend
npm install
```

4. Create environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Development

1. Start the backend server:

```bash
cd backend
uvicorn app.main:app --reload
```

2. Start the frontend development server:

```bash
cd frontend
npm run dev
```

## Documentation

- [Backend Documentation](backend/README.md)
- [Frontend Documentation](frontend/README.md)
- [API Documentation](docs/api.md)

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
