# Harmonic Universe API Documentation

## Base URL

The base URL for all API endpoints is:

`http://127.0.0.1:5001/api`

## Authentication

Most endpoints require authentication using a Bearer token in the Authorization header:

`Authorization: Bearer <token>`

## Error Handling

All error responses follow this format:

```json
{
  "error": "Error message",
  "type": "error_type",
  "details": "Optional detailed error message"
}
```

Error types include:

- `validation_error`: Invalid input data
- `authorization_error`: Authentication/permission issues
- `not_found_error`: Resource not found
- `server_error`: Unexpected server errors

## Endpoints

### 1. Authentication

#### POST /auth/signup

Creates a new user account.

**Request Body:**

```json
{
  "username": "string (3-40 chars, alphanumeric with _ and -)",
  "email": "valid email format",
  "password": "string (min 8 chars, must contain uppercase, lowercase, and number)"
}
```

**Response (201 Created):**

```json
{
  "message": "User created successfully",
  "token": "string",
  "user": {
    "id": "integer",
    "email": "string",
    "username": "string"
  }
}
```

#### POST /auth/login

Authenticates a user.

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200 OK):**

```json
{
  "message": "Logged in successfully",
  "token": "string",
  "user": {
    "id": "integer",
    "email": "string",
    "username": "string"
  }
}
```

#### POST /auth/token

Get an authentication token.

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200 OK):**

```json
{
  "token": "string",
  "user": {
    "id": "integer",
    "email": "string",
    "username": "string"
  }
}
```

#### GET /auth/validate

Validates the current token.

**Response (200 OK):**

```json
{
  "valid": true,
  "user": {
    "id": "integer",
    "email": "string",
    "username": "string"
  }
}
```

#### PUT /auth/user

Updates the authenticated user's information.

**Request Body:**

```json
{
  "username": "string (3-40 chars, alphanumeric with _ and -) (optional)",
  "email": "valid email format (optional)",
  "password": "string (min 8 chars, must contain uppercase, lowercase, and number) (optional)"
}
```

**Response (200 OK):**

```json
{
  "message": "User updated successfully",
  "user": {
    "id": "integer",
    "email": "string",
    "username": "string"
  }
}
```

#### DELETE /auth/user

Deletes the authenticated user's account.

**Response (200 OK):**

```json
{
  "message": "User account deleted successfully"
}
```

### 2. Universe Management

All universe endpoints require authentication.

#### POST /universes

Creates a new universe.

**Request Body:**

```json
{
  "name": "string (3-100 chars)",
  "description": "string (optional)",
  "gravity_constant": "number (positive)",
  "environment_harmony": "number (0-1)"
}
```

**Response (201 Created):**

```json
{
  "message": "Universe created successfully",
  "universe": {
    "id": "integer",
    "name": "string",
    "description": "string",
    "gravity_constant": "number",
    "environment_harmony": "number",
    "created_at": "string",
    "updated_at": "string",
    "creator_id": "integer"
  }
}
```

#### GET /universes

Retrieves all universes for the authenticated user.

**Response (200 OK):**

```json
[
  {
    "id": "integer",
    "name": "string",
    "description": "string",
    "gravity_constant": "number",
    "environment_harmony": "number",
    "created_at": "string",
    "updated_at": "string",
    "creator_id": "integer"
  }
]
```

#### GET /universes/{id}

Retrieves a specific universe.

**Response (200 OK):**

```json
{
  "id": "integer",
  "name": "string",
  "description": "string",
  "gravity_constant": "number",
  "environment_harmony": "number",
  "created_at": "string",
  "updated_at": "string",
  "creator_id": "integer"
}
```

#### PUT /universes/{id}

Updates a universe.

**Request Body:**

```json
{
  "name": "string (3-100 chars, optional)",
  "description": "string (optional)",
  "gravity_constant": "number (positive, optional)",
  "environment_harmony": "number (0-1, optional)"
}
```

**Response (200 OK):**

```json
{
  "message": "Universe updated successfully",
  "universe": {
    "id": "integer",
    "name": "string",
    "description": "string",
    "gravity_constant": "number",
    "environment_harmony": "number",
    "created_at": "string",
    "updated_at": "string",
    "creator_id": "integer"
  }
}
```

#### DELETE /universes/{id}

Deletes a universe.

**Response (200 OK):**

```json
{
  "message": "Universe deleted successfully"
}
```

### 3. Physics Parameters

#### POST /universes/{universe_id}/physics

Creates a new physics parameter.

**Request Body:**

```json
{
  "parameter_name": "string (2-50 chars)",
  "value": "number",
  "unit": "string (1-20 chars)"
}
```

**Response (201 Created):**

```json
{
  "message": "Physics parameter created successfully",
  "parameter": {
    "id": "integer",
    "parameter_name": "string",
    "value": "number",
    "unit": "string",
    "created_at": "string",
    "updated_at": "string",
    "universe_id": "integer"
  }
}
```

#### GET /universes/{universe_id}/physics

Retrieves all physics parameters for a universe.

**Query Parameters:**

- `page`: Page number (default: 1, must be > 0)
- `per_page`: Items per page (default: 10, range: 1-100)
- `sort_by`: Field to sort by (default: created_at)
  - Valid fields: created_at, updated_at, name, value
- `order`: Sort order (asc/desc, default: desc)

**Response (200 OK):**

```json
{
  "parameters": [
    {
      "id": "integer",
      "parameter_name": "string",
      "value": "number",
      "unit": "string",
      "created_at": "string",
      "updated_at": "string",
      "universe_id": "integer"
    }
  ],
  "pagination": {
    "page": "integer",
    "per_page": "integer",
    "total_pages": "integer",
    "total_items": "integer"
  }
}
```

#### PUT /universes/{universe_id}/physics/{parameter_id}

Updates a physics parameter.

**Request Body:**

```json
{
  "parameter_name": "string (2-50 chars)",
  "value": "number",
  "unit": "string (1-20 chars)"
}
```

**Response (200 OK):**

```json
{
  "message": "Physics parameter updated successfully",
  "parameter": {
    "id": "integer",
    "parameter_name": "string",
    "value": "number",
    "unit": "string",
    "created_at": "string",
    "updated_at": "string",
    "universe_id": "integer"
  }
}
```

#### DELETE /universes/{universe_id}/physics/{parameter_id}

Deletes a physics parameter.

**Response (200 OK):**

```json
{
  "message": "Physics parameter deleted successfully"
}
```

### 4. Music Parameters

#### POST /universes/{universe_id}/music

Creates a new music parameter.

**Request Body:**

```json
{
  "parameter_name": "string (2-50 chars)",
  "value": "number",
  "instrument": "string (2-50 chars)"
}
```

**Response (201 Created):**

```json
{
  "message": "Music parameter created successfully",
  "parameter": {
    "id": "integer",
    "parameter_name": "string",
    "value": "number",
    "instrument": "string",
    "created_at": "string",
    "updated_at": "string",
    "universe_id": "integer"
  }
}
```

#### GET /universes/{universe_id}/music

Retrieves all music parameters for a universe.

**Query Parameters:**

- `page`: Page number (default: 1, must be > 0)
- `per_page`: Items per page (default: 10, range: 1-100)
- `sort_by`: Field to sort by (default: created_at)
  - Valid fields: created_at, updated_at, name, value
- `order`: Sort order (asc/desc, default: desc)

**Response (200 OK):**

```json
{
  "parameters": [
    {
      "id": "integer",
      "parameter_name": "string",
      "value": "number",
      "instrument": "string",
      "created_at": "string",
      "updated_at": "string",
      "universe_id": "integer"
    }
  ],
  "pagination": {
    "page": "integer",
    "per_page": "integer",
    "total_pages": "integer",
    "total_items": "integer"
  }
}
```

#### PUT /universes/{universe_id}/music/{parameter_id}

Updates a music parameter.

**Request Body:**

```json
{
  "parameter_name": "string (2-50 chars)",
  "value": "number",
  "instrument": "string (2-50 chars)"
}
```

**Response (200 OK):**

```json
{
  "message": "Music parameter updated successfully",
  "parameter": {
    "id": "integer",
    "parameter_name": "string",
    "value": "number",
    "instrument": "string",
    "created_at": "string",
    "updated_at": "string",
    "universe_id": "integer"
  }
}
```

#### DELETE /universes/{universe_id}/music/{parameter_id}

Deletes a music parameter.

**Response (200 OK):**

```json
{
  "message": "Music parameter deleted successfully"
}
```

### 5. Storyboard

#### POST /universes/{universe_id}/storyboard

Creates a new plot point.

**Request Body:**

```json
{
  "plot_point": "string",
  "description": "string",
  "harmony_tie": "number (0-1)"
}
```

**Response (201 Created):**

```json
{
  "message": "Storyboard created successfully",
  "storyboard": {
    "id": "integer",
    "plot_point": "string",
    "description": "string",
    "harmony_tie": "number",
    "created_at": "string",
    "updated_at": "string",
    "universe_id": "integer"
  }
}
```

#### GET /universes/{universe_id}/storyboard

Retrieves plot points for a universe.

**Query Parameters:**

- `page`: Page number (default: 1, must be > 0)
- `per_page`: Items per page (default: 10, range: 1-100)
- `sort_by`: Field to sort by (options: created_at, updated_at, harmony_tie, plot_point; default: created_at)
- `order`: Sort order (options: asc, desc; default: desc)
- `harmony_min`: Minimum harmony tie value (0-1)
- `harmony_max`: Maximum harmony tie value (0-1)

**Response (200 OK):**

```json
{
  "storyboards": [
    {
      "id": "integer",
      "plot_point": "string",
      "description": "string",
      "harmony_tie": "number",
      "created_at": "string",
      "updated_at": "string",
      "universe_id": "integer"
    }
  ],
  "pagination": {
    "page": "integer",
    "per_page": "integer",
    "total_pages": "integer",
    "total_items": "integer"
  },
  "filters": {
    "harmony_min": "number",
    "harmony_max": "number",
    "sort_by": "string",
    "order": "string"
  }
}
```

#### PUT /universes/{universe_id}/storyboard/{storyboard_id}

Updates a plot point.

**Request Body:**

```json
{
  "plot_point": "string",
  "description": "string",
  "harmony_tie": "number (0-1)"
}
```

**Response (200 OK):**

```json
{
  "message": "Plot Point updated successfully",
  "storyboard": {
    "id": "integer",
    "plot_point": "string",
    "description": "string",
    "harmony_tie": "number",
    "created_at": "string",
    "updated_at": "string",
    "universe_id": "integer"
  }
}
```

#### DELETE /universes/{universe_id}/storyboard/{storyboard_id}

Deletes a plot point.

**Response (200 OK):**

```json
{
  "message": "Plot Point deleted successfully"
}
```

## Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting

Currently, there are no rate limits implemented.
