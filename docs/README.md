# Harmonic Universe

A creative platform for generating and visualizing harmonious audio-visual experiences through physics-based interactions.

## Project Structure

```
.
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── store/        # Redux store configuration
│   │   ├── features/     # Feature-specific components and logic
│   │   ├── styles/       # CSS styles and theme configuration
│   │   ├── utils/        # Utility functions
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API service functions
│   │   └── types/        # TypeScript type definitions
│   └── public/           # Static assets
│
├── backend/
│   ├── app/
│   │   ├── api/          # API routes and endpoints
│   │   ├── models/       # Database models
│   │   │   ├── core/     # Core models (Universe, User)
│   │   │   ├── audio/    # Audio-related models
│   │   │   └── visualization/  # Visualization models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utility functions
│   └── migrations/       # Database migrations
│
└── docs/                 # Project documentation
```

## Features

- Physics-based audio generation
- Real-time visualization
- Collaborative universe creation
- Audio file management
- Custom visualization settings

## Technology Stack

### Frontend

- React
- Redux Toolkit
- Material-UI
- Vite
- CSS Modules

### Backend

- FastAPI
- SQLAlchemy
- Pydantic
- Alembic
- PostgreSQL

## Getting Started

1. Clone the repository
2. Install dependencies:

   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd backend
   pip install -r requirements.txt
   ```

3. Set up environment variables:

   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Update the variables as needed

4. Run the development servers:

   ```bash
   # Frontend
   npm run dev

   # Backend
   uvicorn app.main:app --reload
   ```

## Development Guidelines

- Follow the established directory structure
- Use appropriate naming conventions
- Write tests for new features
- Update documentation as needed
- Follow the style guide for consistent code formatting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
