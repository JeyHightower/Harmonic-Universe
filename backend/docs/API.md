# Harmonic Universe API Documentation

This directory contains documentation for the Harmonic Universe API endpoints.

## API Structure

The API follows a RESTful structure with the following main resources:

- Users: Authentication and user management
- Universes: Story universes containing scenes, characters, etc.
- Scenes: Individual scenes within a universe
- Characters: Characters that appear in scenes
- Notes: Notes associated with universes, scenes, or characters

## API Endpoints Documentation

Detailed documentation for specific API endpoints:

- [Scenes API](api/SCENES.md): Information about scene-related endpoints

## Best Practices

### Endpoint Consistency

We have consolidated duplicate endpoints to maintain a single source of truth. For example, to get scenes for a universe:

✅ **Use:** `/api/scenes/universe/:universe_id`  
❌ **Avoid:** `/api/universes/:universe_id/scenes` (redirects to primary endpoint)

When developing new features, always check the endpoint documentation to use the primary endpoints.
