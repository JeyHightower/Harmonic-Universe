# **Harmonic Universe API Documentation**

## **Base URL**

The base URL for all API endpoints is:

```http://localhost:5000/api
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
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response (201 Created):**

```json
{
  "token": "string",
  "user": {
    "id": "integer",
    "username": "string",
    "email": "string"
  }
}
```

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

- `sort_by`: Field to sort by (default: created_at)
- `order`: Sort order (asc/desc, default: desc)
- `harmony_min`: Minimum harmony tie value
- `harmony_max`: Maximum harmony tie value

**Response (200 OK):**

```json
[
  {
    "id": "integer",
    "plot_point": "string",
    "description": "string",
    "harmony_tie": "number",
    "created_at": "string",
    "updated_at": "string",
    "universe_id": "integer"
  }
]
```

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

[Similar structure for physics parameter endpoints...]

### **5. Music Parameters**

[Similar structure for music parameter endpoints...]

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
