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

# 🎨 Frontend Architecture

## 📁 Directory Structure

```
frontend/
├── src/
│   ├── components/         # React components
│   │   ├── auth/          # Authentication components
│   │   ├── universe/      # Universe management
│   │   ├── visualization/ # Visualization components
│   │   └── common/        # Shared components
│   ├── store/             # Redux store
│   │   ├── slices/        # Redux slices
│   │   ├── middleware/    # Redux middleware
│   │   └── reducers/      # Redux reducers
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── styles/            # Global styles
│   ├── types/             # TypeScript types
│   └── App.tsx            # Root component
├── public/                # Static assets
└── tests/                 # Test suite
```

## 🧩 Core Components

### Authentication

1. **Login/Register**

   - JWT authentication
   - Form validation
   - Error handling

2. **Profile Management**
   - User settings
   - Profile updates
   - Session handling

### Universe Management

1. **Universe Creation**

   - Parameter configuration
   - Template selection
   - Real-time preview

2. **Universe Detail**
   - Physics parameters
   - Music parameters
   - Story points
   - Real-time updates

### Visualization

1. **Canvas**

   - WebGL rendering
   - Real-time updates
   - Interactive elements

2. **Controls**
   - Parameter adjustment
   - View manipulation
   - Export options

### Music Generation

1. **Audio Controls**

   - Playback controls
   - Parameter adjustment
   - Real-time generation

2. **Visualization**
   - Frequency analysis
   - Waveform display
   - Parameter mapping

## 🔄 State Management

### Redux Store

1. **Slices**

   - Universe slice
   - Auth slice
   - Visualization slice
   - Audio slice

2. **Middleware**

   - WebSocket middleware
   - API middleware
   - Logger middleware

3. **Reducers**
   - Combined reducers
   - State normalization
   - Performance optimization

## 🎨 Styling

1. **Global Styles**

   - Theme configuration
   - Color schemes
   - Typography

2. **Component Styles**
   - Styled components
   - CSS modules
   - Responsive design

## 🔌 API Integration

1. **REST API**

   - Axios configuration
   - Request/response handling
   - Error management

2. **WebSocket**
   - Real-time updates
   - Event handling
   - Connection management

## 🧪 Testing

1. **Unit Tests**

   - Component testing
   - Hook testing
   - Utility testing

2. **Integration Tests**
   - Store testing
   - API testing
   - Flow testing

## 📱 Responsive Design

1. **Breakpoints**

   - Mobile first
   - Tablet support
   - Desktop optimization

2. **Layout**
   - Fluid grids
   - Flexible components
   - Adaptive UI

## 🔒 Security

1. **Authentication**

   - Token management
   - Route protection
   - Session handling

2. **Data Protection**
   - Input validation
   - XSS prevention
   - CSRF protection

## 🚀 Performance

1. **Optimization**

   - Code splitting
   - Lazy loading
   - Bundle optimization

2. **Caching**
   - API response caching
   - Asset caching
   - State persistence

## 📦 Dependencies

- React: UI framework
- Redux: State management
- TypeScript: Type safety
- Styled Components: Styling
- Three.js: 3D visualization
- Tone.js: Audio processing

## 🛠️ Development

1. **Setup**

   - Environment configuration
   - Development tools
   - IDE integration

2. **Workflow**
   - Component development
   - Testing process
   - Code review

## 📚 Documentation

1. **Components**

   - Props documentation
   - Usage examples
   - Best practices

2. **API**
   - Endpoint documentation
   - Request/response formats
   - Error handling

## 🔄 Continuous Integration

1. **Build Process**

   - Automated builds
   - Testing pipeline
   - Deployment workflow

2. **Quality Assurance**
   - Code linting
   - Type checking
   - Test coverage
