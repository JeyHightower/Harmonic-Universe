# **Harmonic Universe API Documentation**

## **Base URL**

The base URL for all API endpoints is:

```http://localhost:5001/api

```

## **Authentication**

Most endpoints require authentication using a Bearer token in the Authorization header:

```Authorization: Bearer <token>

```

## **CSRF Protection**

For non-GET requests, include the CSRF token in the header:

```X-CSRF-Token: <token>

```

Get a CSRF token using the `/api/csrf/token` endpoint.

## **Error Handling**

All error responses follow this format:

```json
{
  "error": "Error message",
  "type": "error_type"
}
```

Error types include:

- `validation_error`: Invalid input data
- `authorization_error`: Authentication/permission issues
- `not_found_error`: Resource not found
- `server_error`: Unexpected server errors

## **Endpoints**

### **1. Authentication**

#### **POST /auth/signup**

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
    "username": "string",
    "email": "string"
  }
}
```

**Error Responses:**

- 400 Bad Request:
  - No data provided
  - Missing required fields
  - Invalid email format
  - Username too short/long
  - Invalid username characters
  - Password requirements not met
  - Email already registered
  - Username already taken
- 500 Server Error: Unexpected server error

#### **POST /auth/login**

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
  "token": "string"
}
```

#### **GET /auth/validate**

Validates the current token.

**Response (200 OK):**

```json
{
  "valid": true,
  "user": {
    "id": "integer",
    "username": "string",
    "email": "string"
  }
}
```

#### **POST /auth/token/refresh**

Refreshes the authentication token.

**Response (200 OK):**

```json
{
  "token": "string"
}
```

### **2. Universe Management**

#### **POST /universes**

Creates a new universe.

**Request Body:**

```json
{
  "name": "string",
  "description": "string",
  "gravity_constant": "number",
  "environment_harmony": "number"
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

#### **GET /universes**

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

#### **GET /universes/{id}**

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

#### **PUT /universes/{id}**

Updates a universe.

**Request Body:**

```json
{
  "name": "string",
  "description": "string",
  "gravity_constant": "number",
  "environment_harmony": "number"
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

#### **DELETE /universes/{id}**

Deletes a universe.

**Response (200 OK):**

```json
{
  "message": "Universe deleted successfully"
}
```

### **3. Storyboard Management**

#### **POST /universes/{universe_id}/storyboards**

Creates a new storyboard.

**Request Body:**

```json
{
  "plot_point": "string (max 500 chars)",
  "description": "string (max 2000 chars)",
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

#### **GET /universes/{universe_id}/storyboards**

Retrieves all storyboards for a universe.

**Query Parameters:**

- `page`: Page number (default: 1, must be > 0)
- `per_page`: Items per page (default: 10, range: 1-100)
- `sort_by`: Field to sort by (default: created_at)
  - Valid fields: created_at, updated_at, harmony_tie, plot_point
- `order`: Sort order (asc/desc, default: desc)
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
    "harmony_min": "number or null",
    "harmony_max": "number or null",
    "sort_by": "string",
    "order": "string"
  }
}
```

**Error Responses:**

- 400 Bad Request:
  - Invalid page number
  - Invalid items per page
  - Invalid harmony range
  - Invalid sort field
  - Invalid sort order
- 403 Forbidden: Not authorized to access this universe
- 404 Not Found: Universe not found
- 500 Server Error: Unexpected server error

#### **PUT /universes/{universe_id}/storyboards/{storyboard_id}**

Updates a storyboard.

**Request Body:**

```json
{
  "plot_point": "string (max 500 chars)",
  "description": "string (max 2000 chars)",
  "harmony_tie": "number (0-1)"
}
```

**Response (200 OK):**

```json
{
  "message": "Storyboard updated successfully",
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

#### **DELETE /universes/{universe_id}/storyboards/{storyboard_id}**

Deletes a storyboard.

**Response (200 OK):**

```json
{
  "message": "Storyboard deleted successfully",
  "deleted_storyboard": {
    "id": "integer",
    "universe_id": "integer"
  }
}
```

### **4. Physics Parameters**

#### **POST /universes/{universe_id}/physics**

Creates a new physics parameter.

**Request Body:**

```json
{
  "name": "string (max 100 chars)",
  "value": "number",
  "unit": "string (max 50 chars)",
  "description": "string (max 500 chars)"
}
```

**Response (201 Created):**

```json
{
  "message": "Physics parameter created successfully",
  "parameter": {
    "id": "integer",
    "name": "string",
    "value": "number",
    "unit": "string",
    "description": "string",
    "created_at": "string",
    "updated_at": "string",
    "universe_id": "integer"
  }
}
```

#### **GET /universes/{universe_id}/physics**

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
      "name": "string",
      "value": "number",
      "unit": "string",
      "description": "string",
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

#### **PUT /universes/{universe_id}/physics/{parameter_id}**

Updates a physics parameter.

**Request Body:**

```json
{
  "name": "string (max 100 chars)",
  "value": "number",
  "unit": "string (max 50 chars)",
  "description": "string (max 500 chars)"
}
```

**Response (200 OK):**

```json
{
  "message": "Physics parameter updated successfully",
  "parameter": {
    "id": "integer",
    "name": "string",
    "value": "number",
    "unit": "string",
    "description": "string",
    "created_at": "string",
    "updated_at": "string",
    "universe_id": "integer"
  }
}
```

#### **DELETE /universes/{universe_id}/physics/{parameter_id}**

Deletes a physics parameter.

**Response (200 OK):**

```json
{
  "message": "Physics parameter deleted successfully",
  "deleted_parameter": {
    "id": "integer",
    "universe_id": "integer"
  }
}
```

### **5. Music Parameters**

#### **POST /universes/{universe_id}/music**

Creates a new music parameter.

**Request Body:**

```json
{
  "name": "string (max 100 chars)",
  "value": "number",
  "unit": "string (max 50 chars)",
  "description": "string (max 500 chars)",
  "harmony_impact": "number (0-1)"
}
```

**Response (201 Created):**

```json
{
  "message": "Music parameter created successfully",
  "parameter": {
    "id": "integer",
    "name": "string",
    "value": "number",
    "unit": "string",
    "description": "string",
    "harmony_impact": "number",
    "created_at": "string",
    "updated_at": "string",
    "universe_id": "integer"
  }
}
```

#### **GET /universes/{universe_id}/music**

Retrieves all music parameters for a universe.

**Query Parameters:**

- `page`: Page number (default: 1, must be > 0)
- `per_page`: Items per page (default: 10, range: 1-100)
- `sort_by`: Field to sort by (default: created_at)
  - Valid fields: created_at, updated_at, name, value, harmony_impact
- `order`: Sort order (asc/desc, default: desc)
- `harmony_min`: Minimum harmony impact value (0-1)
- `harmony_max`: Maximum harmony impact value (0-1)

**Response (200 OK):**

```json
{
  "parameters": [
    {
      "id": "integer",
      "name": "string",
      "value": "number",
      "unit": "string",
      "description": "string",
      "harmony_impact": "number",
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
    "harmony_min": "number or null",
    "harmony_max": "number or null",
    "sort_by": "string",
    "order": "string"
  }
}
```

#### **PUT /universes/{universe_id}/music/{parameter_id}**

Updates a music parameter.

**Request Body:**

```json
{
  "name": "string (max 100 chars)",
  "value": "number",
  "unit": "string (max 50 chars)",
  "description": "string (max 500 chars)",
  "harmony_impact": "number (0-1)"
}
```

**Response (200 OK):**

```json
{
  "message": "Music parameter updated successfully",
  "parameter": {
    "id": "integer",
    "name": "string",
    "value": "number",
    "unit": "string",
    "description": "string",
    "harmony_impact": "number",
    "created_at": "string",
    "updated_at": "string",
    "universe_id": "integer"
  }
}
```

#### **DELETE /universes/{universe_id}/music/{parameter_id}**

Deletes a music parameter.

**Response (200 OK):**

```json
{
  "message": "Music parameter deleted successfully",
  "deleted_parameter": {
    "id": "integer",
    "universe_id": "integer"
  }
}
```

**Error Responses for Physics and Music Parameters:**

- 400 Bad Request:
  - Missing required fields
  - Invalid field values
  - Invalid pagination parameters
  - Invalid sort parameters
  - Invalid harmony range (music only)
- 403 Forbidden: Not authorized to access this universe
- 404 Not Found: Universe or parameter not found
- 500 Server Error: Unexpected server error

## **Status Codes**

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## **Rate Limiting**

Currently, there are no rate limits implemented.
