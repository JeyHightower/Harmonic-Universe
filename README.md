# Harmonic Universe

Welcome to the Harmonic Universe repository! This project is a collaborative physics playground designed for educational purposes.

## Overview

The Harmonic Universe is a platform that allows users to create, share, and interact with physical simulations in a 2D environment. Users can create "universes" with specific physics properties and build interactive scenes.

## Technology Stack

- **Backend**: Python/Flask
- **Frontend**: React/JavaScript
- **Database**: PostgreSQL (required for both development and production)
- **Deployment**: Render.com

## Repository Structure

- `/frontend` - React JavaScript frontend application
- `/backend` - Flask Python backend API
- `/scripts` - Utility scripts for development and deployment
- `/docs` - Documentation files

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL (required - this project does not support SQLite)
- Redis (optional, for rate limiting)

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

3. Set up the PostgreSQL database:

   ```bash
   # Create a PostgreSQL database
   createdb harmonic_universe  # If using local PostgreSQL

   # Update .env file with PostgreSQL connection string
   # DATABASE_URL=postgresql://postgres:password@localhost:5432/harmonic_universe

   # Run the setup script
   python setup_db.py
   ```

4. Start the backend server:

   ```bash
   python run.py
   ```

5. Set up the frontend:

   ```bash
   cd ../frontend
   npm install
   ```

6. Start the frontend development server:

   ```bash
   npm run dev
   ```

7. Open your browser and navigate to http://localhost:5173

## Development

Please see the README files in the `/frontend` and `/backend` directories for detailed development instructions.

## Database Configuration

This project requires PostgreSQL for both development and production environments. SQLite is not supported.

### Local Development

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/harmonic_universe
```

### Production (Render.com)

The PostgreSQL database is automatically configured in the `render.yaml` file.

## Deployment

The application can be deployed to Render.com using the provided `render.yaml` configuration file.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

This project was created by the App Academy Capstone Team.
