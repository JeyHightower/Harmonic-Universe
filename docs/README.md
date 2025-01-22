# Harmonic Universe Documentation

## Overview

Welcome to the Harmonic Universe documentation. This guide provides comprehensive information about the system's architecture, features, and implementation details.

## Documentation Structure

### Core Documentation

- [Architecture](ARCHITECTURE.md) - System architecture and component overview
- [API Documentation](API.md) - REST API endpoints and WebSocket events
- [Parameter Relationships](PARAMETER_RELATIONSHIPS.md) - How different parameters interact
- [Features Checklist](FEATURES_CHECKLIST.md) - Complete feature list and implementation status

### User Guides

- [User Guide](USER_GUIDE.md) - End-user documentation
- [Setup Guide](SETUP.md) - Installation and setup instructions
- [Contributing Guide](CONTRIBUTING.md) - Guidelines for contributors

### Technical Documentation

- [Project Structure](PROJECT_STRUCTURE.md) - Codebase organization
- [WebSocket Protocol](WEBSOCKET_PROTOCOL.md) - Real-time communication details
- [AI Integration](AI_INTEGRATION.md) - AI features and implementation
- [Test Plan](TEST_PLAN.md) - Testing strategy and procedures
- [Deployment](DEPLOYMENT.md) - Deployment procedures and configurations

### Additional Resources

- [Professional Guide](PROFESSIONAL_GUIDE.md) - Best practices and advanced usage
- [Educational Guide](EDUCATIONAL_GUIDE.md) - Learning resources and tutorials

## Quick Start

1. **Setup**

   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/harmonic-universe.git
   cd harmonic-universe

   # Install dependencies
   ./setup.sh
   ```

2. **Development**

   ```bash
   # Start backend
   cd backend
   flask run

   # Start frontend
   cd frontend
   npm run dev
   ```

3. **Testing**
   ```bash
   # Run all tests
   ./run_all_tests.sh
   ```

## Directory Structure

```
docs/
├── api/              - Detailed API documentation
├── features/         - Feature specifications
├── monitoring/       - Monitoring and metrics
├── pwa/             - Progressive Web App docs
├── testing/         - Test documentation
└── *.md             - Core documentation files
```

## Contributing

Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
