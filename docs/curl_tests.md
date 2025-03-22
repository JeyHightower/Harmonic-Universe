# Harmonic Universe API Tests

## Universe Management CRUD Tests

### Get All Universes

```bash
curl http://localhost:5001/api/universes
```

### Get a Specific Universe

```bash
curl http://localhost:5001/api/universes/1
```

### Create a Universe

```bash
curl -X POST http://localhost:5001/api/universes \
  -H "Content-Type: application/json" \
  -d '{"name": "New Test Universe", "description": "A new test universe", "is_public": true}'
```

### Update a Universe

```bash
curl -X PUT http://localhost:5001/api/universes/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Universe", "description": "Updated description"}'
```

### Delete a Universe

```bash
curl -X DELETE http://localhost:5001/api/universes/2
```

## Scene Management CRUD Tests

### Get All Scenes

```bash
curl http://localhost:5001/api/scenes
```

### Get Scenes for a Specific Universe

```bash
curl http://localhost:5001/api/scenes?universe_id=1
```

### Get a Specific Scene

```bash
curl http://localhost:5001/api/scenes/1
```

### Create a Scene

```bash
curl -X POST http://localhost:5001/api/scenes \
  -H "Content-Type: application/json" \
  -d '{"title": "New Test Scene", "description": "A new test scene", "universe_id": 1}'
```

### Update a Scene

```bash
curl -X PUT http://localhost:5001/api/scenes/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Scene", "description": "Updated description"}'
```

### Delete a Scene

```bash
curl -X DELETE http://localhost:5001/api/scenes/2
```

## User Authentication Tests

### Register a New User

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "password123"}'
```

### Login

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### Demo Login

```bash
curl -X POST http://localhost:5001/auth/demo-login \
  -H "Content-Type: application/json"
```

### Get User Info

```bash
curl http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer demo-token"
```

### Logout

```bash
curl -X POST http://localhost:5001/api/auth/logout \
  -H "Authorization: Bearer demo-token"
```
