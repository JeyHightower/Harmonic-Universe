# Contributing to Harmonic Universe

Thank you for your interest in contributing to Harmonic Universe! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

### Prerequisites

Before you begin, ensure you have met the [prerequisites in the README](README.md#prerequisites).

### Local Development Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/harmonic-universe.git
   cd harmonic-universe
   ```
3. Add the original repository as a remote:
   ```bash
   git remote add upstream https://github.com/original-org/harmonic-universe.git
   ```
4. Follow the installation instructions in the [README](README.md#installation) to set up your development environment

## Development Workflow

1. Create a new branch for your feature or bugfix:

   ```bash
   git checkout -b feature/your-feature-name
   # or for bugfix
   git checkout -b fix/bug-description
   ```

2. Make your changes, following our [coding standards](#coding-standards)

3. Run the appropriate tests:

   ```bash
   # Run backend tests
   ./run.sh test backend

   # Run frontend tests
   ./run.sh test frontend

   # Run API tests
   ./run.sh test api
   ```

4. Ensure your code passes linting:

   ```bash
   # Backend
   cd backend
   source venv/bin/activate
   flake8 .

   # Frontend
   cd frontend
   npm run lint
   ```

5. Commit your changes following our [commit guidelines](#commit-guidelines)

6. Push your changes to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

7. Open a pull request to the main repository

## Coding Standards

### Python (Backend)

- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) coding style
- Use type hints where appropriate
- Write docstrings for all functions, classes, and modules
- Maintain 100% test coverage for new code where possible
- Use f-strings for string formatting

### JavaScript/React (Frontend)

- Follow the ESLint configuration in the project
- Use functional components with hooks over class components
- Use named exports instead of default exports where possible
- Keep components small and focused on a single responsibility
- Utilize TypeScript types for component props
- Follow Redux best practices for state management

### CSS/Styling

- Use CSS variables for theme colors and consistent values
- Follow BEM (Block Element Modifier) naming convention
- Ensure responsive design for all screen sizes
- Test cross-browser compatibility

### General Guidelines

- Keep functions/methods short and focused on a single task
- Use meaningful variable and function names
- Write clear comments for complex logic
- Follow the DRY (Don't Repeat Yourself) principle
- Consider accessibility in UI components

## Commit Guidelines

We follow a simplified version of [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short summary>
```

Types include:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code changes that neither fix bugs nor add features
- **test**: Adding or updating tests
- **chore**: Changes to build process, dependencies, etc.

Examples:

- `feat: add universe physics parameter validation`
- `fix: prevent audio glitches during music generation`
- `docs: update API documentation for universe endpoints`

## Pull Request Process

1. Update the README.md or relevant documentation with details of changes if applicable
2. Add appropriate tests for your changes
3. Ensure all tests pass locally
4. Fill out the pull request template completely
5. Request a review from at least one maintainer
6. Address any feedback from code reviews
7. The PR will be merged once it receives approval from the maintainers

## Reporting Bugs

When reporting bugs, please use the bug report template and include:

- A clear and descriptive title
- Steps to reproduce the bug
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment information (browser, OS, etc.)
- Additional context if needed

## Feature Requests

For feature requests, please:

- Use the feature request template
- Clearly describe the problem your feature would solve
- Explain the solution you'd like to see
- Provide context about alternative solutions you've considered
- Include mockups or diagrams if relevant to the request

## Documentation

Good documentation is essential to the project. Consider contributing to:

- Code documentation (docstrings, comments)
- API documentation
- User guides and tutorials
- Example use cases
- Troubleshooting guides

## Community

- Join our [Discord server](https://discord.gg/harmonic-universe) for discussions
- Participate in the [GitHub Discussions](https://github.com/org/harmonic-universe/discussions) for feature ideas and general questions
- Attend our monthly community calls (see our website for the schedule)

---

Thank you for contributing to Harmonic Universe! Your efforts help make this project better for everyone.
