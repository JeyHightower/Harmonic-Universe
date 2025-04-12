# API Services

This directory contains all API-related services for the Harmonic Universe application.

## Directory Structure

```
/services/
  ├── config.js           - API configuration settings
  ├── endpoints.js        - API endpoint definitions
  ├── httpClient.js       - Core HTTP functionality
  ├── index.js            - Main entry point
  ├── responseHandler.js  - Response processing utilities
  └── services/           - Domain-specific services
      ├── authService.js      - Authentication operations
      ├── universeService.js  - Universe operations
      ├── sceneService.js     - Scene operations
      ├── characterService.js - Character operations
      ├── noteService.js      - Note operations
      ├── userService.js      - User profile operations
      ├── audioService.js     - Audio operations
      └── systemService.js    - System operations
```

## Usage

### Basic Usage

```javascript
// Import the main API service
import api from '../services';

// Use domain-specific services
const universes = await api.universes.getAllUniverses();
const user = await api.auth.login(email, password);
```

### Direct Imports

You can also import specific services directly:

```javascript
// Import specific services
import { authService } from '../services';
import { universeService } from '../services';

// Use the services
const user = await authService.login(email, password);
const universes = await universeService.getAllUniverses();
```

### Error Handling

All API responses follow a standard format:

```javascript
// Success response
{
  success: true,
  status: 200,
  message: 'Request successful',
  data: {...} // Response data
}

// Error response
{
  success: false,
  status: 404,
  message: 'Resource not found',
  data: null
}
```

## Core Components

### config.js

Contains configuration settings for API requests, including:
- Base URL
- Timeout settings
- Authentication settings
- Cache configuration

### endpoints.js

Single source of truth for all API endpoints, organized by domain.

### httpClient.js

Core HTTP client that provides methods for different HTTP verbs (GET, POST, etc.)
with built-in features like:
- Authentication token handling
- Response caching
- Error handling
- Request logging

### responseHandler.js

Utilities for handling API responses consistently:
- Standardized success/error response format
- Response validation
- Error formatting and logging

## Domain Services

Each domain service provides a consistent interface for interacting with the API:

### authService.js

Authentication operations like login, register, logout, etc.

### universeService.js

Operations for managing universes: list, create, update, delete, etc.

### Other Services

Other domain-specific services follow the same pattern and structure.

## Contributing

When adding new API functionality:

1. Add endpoints to `endpoints.js`
2. Implement the functionality in the appropriate domain service
3. Export the new functions from the service file
4. Add them to the service object for consolidated export
5. Update this README if you add new service files 