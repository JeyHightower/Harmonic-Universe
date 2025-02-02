# Module Boundaries and Interfaces

## Frontend Modules

### Features
- Each feature is self-contained
- Exports only through public interface (index.ts)
- No direct imports between features

### Common Components
- Reusable UI components
- No business logic
- No feature-specific code

### Layout
- Page layout components
- No business logic
- No feature-specific code

### Services
- API communication
- WebSocket handling
- Authentication

### Store
- State management
- Actions and reducers
- Selectors for data access

## Backend Modules

### API
- Routes
- Controllers
- Middleware
- No direct database access

### Core
- Business logic
- Domain models
- No HTTP/API concerns

### Models
- Database models
- Data validation
- No business logic

### Services
- External service integration
- Cross-cutting concerns
- Authentication/Authorization
