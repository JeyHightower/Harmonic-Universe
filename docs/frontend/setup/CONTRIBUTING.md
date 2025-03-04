# Contributing to Harmonic Universe

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to maintain a respectful and inclusive environment.

## Development Process

### 1. Setting Up Development Environment

1. Fork and clone the repository:

```bash
git clone https://github.com/yourusername/harmonic-universe.git
cd harmonic-universe
```

2. Create a feature branch:

```bash
git checkout -b feature/your-feature-name
```

3. Set up development environment:

```bash
# Backend setup
cd backend
./setup.sh

# Frontend setup
cd frontend
npm install
```

### 2. Coding Standards

#### Python (Backend)

1. **Style Guide**

   - Follow PEP 8
   - Use docstrings
   - Maximum line length: 88 characters (Black formatter)

2. **Documentation**

   - Docstrings for all public functions/methods
   - Inline comments for complex logic

3. **Example**

```python
def calculate_physics(
    gravity: float,
    friction: float,
    time_step: float = 0.016
) -> dict:
    """
    Calculate physics parameters for the simulation.

    Args:
        gravity: Gravitational acceleration (m/s²)
        friction: Friction coefficient (0-1)
        time_step: Simulation time step in seconds

    Returns:
        Dict containing calculated physics values
    """
    return {
        "velocity": gravity * time_step,
        "displacement": 0.5 * gravity * time_step ** 2,
        "friction_force": friction * gravity
    }
```

#### JavaScript (Frontend)

1. **Style Guide**

   - Use ESLint with Airbnb config
   - Use Prettier for formatting
   - Use PropTypes for prop validation

2. **Component Structure**

   - One component per file
   - Use functional components with hooks
   - PropTypes validation
   - Styled components in separate files

3. **Example**

```jsx
import React from 'react';
import PropTypes from 'prop-types';

function PhysicsControls({
  gravity,
  friction,
  onGravityChange,
  onFrictionChange,
}) {
  return (
    <div className="physics-controls">
      <label>
        Gravity:
        <input type="range" value={gravity} onChange={onGravityChange} />
      </label>
      <label>
        Friction:
        <input type="range" value={friction} onChange={onFrictionChange} />
      </label>
    </div>
  );
}

PhysicsControls.propTypes = {
  gravity: PropTypes.number.isRequired,
  friction: PropTypes.number.isRequired,
  onGravityChange: PropTypes.func.isRequired,
  onFrictionChange: PropTypes.func.isRequired,
};

export default PhysicsControls;
```

### 3. Git Workflow

1. **Commit Messages**

   - Format: `type(scope): description`
   - Types: feat, fix, docs, style, refactor, test, chore
   - Example: `feat(physics): add gravity simulation`

2. **Branch Naming**

   - Feature branches: `feature/description`
   - Bug fixes: `fix/description`
   - Documentation: `docs/description`

3. **Pull Requests**
   - Create PR against `develop` branch
   - Include description of changes
   - Reference related issues
   - Add tests for new features
   - Update documentation

### 4. Testing

1. **Backend Tests**

   - Unit tests for all services
   - Integration tests for API endpoints
   - WebSocket event tests
   - Minimum 80% coverage

2. **Frontend Tests**

   - Component unit tests
   - Redux action/reducer tests
   - Integration tests for forms
   - E2E tests for critical flows

3. **Running Tests**

```bash
# Backend tests
cd backend
pytest tests/ -v --cov=app

# Frontend tests
cd frontend
npm test
```

### 5. Documentation

1. **API Documentation**

   - Update API.md for endpoint changes
   - Include request/response examples
   - Document WebSocket events

2. **Code Documentation**
   - Update ARCHITECTURE.md for design changes
   - Document complex algorithms
   - Update README.md for new features

### 6. Review Process

1. **Code Review Checklist**

   - [ ] Follows coding standards
   - [ ] Includes tests
   - [ ] Updates documentation
   - [ ] No unnecessary dependencies
   - [ ] Efficient implementation
   - [ ] Error handling
   - [ ] Security considerations

2. **Performance Review**
   - [ ] No N+1 queries
   - [ ] Proper indexing
   - [ ] Efficient algorithms
   - [ ] Memory usage
   - [ ] Bundle size impact

### 7. Deployment

1. **Staging Deployment**

   - Automatic deployment to staging
   - Run integration tests
   - Performance testing
   - Security scanning

2. **Production Deployment**
   - Manual approval required
   - Database migration review
   - Backup verification
   - Monitoring setup

## Getting Help

- Join our Discord server
- Check existing issues
- Ask in discussions
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Last updated: Thu Jan 30 18:37:47 CST 2025
