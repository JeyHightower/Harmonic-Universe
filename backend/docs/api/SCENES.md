# Scenes API Documentation

## Endpoints

### Getting Scenes for a Universe

**Primary Endpoint (Recommended):**

```
GET /api/scenes/universe/:universe_id
```

This is the preferred endpoint for retrieving all scenes for a specific universe. It's optimized and maintained as the primary source of truth.

**Alternative Endpoint (Legacy Support):**

```
GET /api/universes/:universe_id/scenes
```

This endpoint is maintained for backward compatibility. It internally redirects to the primary endpoint. For new development, please use the primary endpoint.

### Other Scene Endpoints

```
GET /api/scenes/:scene_id          # Get a specific scene by ID
GET /api/scenes/                    # List scenes (supports filtering)
POST /api/scenes/                   # Create a new scene
PUT /api/scenes/:scene_id           # Update a scene
DELETE /api/scenes/:scene_id        # Delete a scene
```

## Best Practices

1. Always use the primary endpoint when possible
2. All new code should reference the primary endpoint
3. Documentation and frontend code should be updated to use the primary endpoint
