# Harmonic Universe

A modern web application for collaborative music creation and visualization.

## Overview

Harmonic Universe is a real-time collaborative platform that allows musicians and artists to create, share, and visualize music together. The application features a modern tech stack with React frontend and Flask backend, supporting real-time collaboration through WebSocket connections.

## Features

- Real-time collaborative music creation
- Interactive music visualization
- User authentication and project management
- Live collaboration features
- Modern, responsive UI

## Tech Stack

### Frontend

- React with TypeScript
- Vite
- TailwindCSS
- Socket.IO Client

### Backend

- Flask
- SQLAlchemy
- PostgreSQL
- Socket.IO

## Quick Start

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/harmonic-universe.git
   cd harmonic-universe
   ```

2. Start the backend:

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Unix
   pip install -r requirements.txt
   flask run
   ```

3. Start the frontend:

   ```bash
   cd frontend
   yarn install
   yarn dev
   ```

4. Open http://localhost:5173 in your browser

## Documentation

For detailed documentation, please see the [docs](./docs) directory:

- [Backend Documentation](./docs/backend/README.md)
- [Frontend Documentation](./docs/frontend/README.md)
- [Deployment Guide](./docs/deployment/README.md)
- [Architecture Overview](./docs/architecture/README.md)

## Development

- Backend development server runs on `http://localhost:5000`
- Frontend development server runs on `http://localhost:5173`
- WebSocket server is integrated with the backend

## Testing

- Backend: `cd backend && pytest`
- Frontend: `cd frontend && yarn test`
- E2E: `cd frontend && yarn cypress:open`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please open an issue in the GitHub repository.
