# Physics Engine API Documentation

## Physics Objects

### Create Physics Object
```http
POST /api/scenes/{scene_id}/physics/objects
```

Create a new physics object in the specified scene.

**Request Body:**
```json
{
  "name": "string",
  "object_type": "circle|rectangle|polygon",
  "mass": "number",
  "position": {
    "x": "number",
    "y": "number"
  },
  "dimensions": {
    // For circle:
    "radius": "number",
    // For rectangle:
    "width": "number",
    "height": "number",
    // For polygon:
    "vertices": [
      {
        "x": "number",
        "y": "number"
      }
    ]
  },
  "is_static": "boolean",
  "is_sensor": "boolean",
  "restitution": "number",
  "friction": "number",
  "collision_filter": {
    "category": "number",
    "mask": "number"
  }
}
```

**Response:**
```json
{
  "id": "number",
  "scene_id": "number",
  // ... all object properties
}
```

### Get Physics Object
```http
GET /api/scenes/{scene_id}/physics/objects/{object_id}
```

Retrieve a specific physics object.

**Response:**
```json
{
  "id": "number",
  "scene_id": "number",
  // ... all object properties
}
```

### Update Physics Object
```http
PUT /api/scenes/{scene_id}/physics/objects/{object_id}
```

Update an existing physics object.

**Request Body:**
```json
{
  // Any updatable object properties
}
```

**Response:**
```json
{
  "id": "number",
  "scene_id": "number",
  // ... all object properties
}
```

### Delete Physics Object
```http
DELETE /api/scenes/{scene_id}/physics/objects/{object_id}
```

Delete a physics object.

**Response:** 204 No Content

## Physics Constraints

### Create Physics Constraint
```http
POST /api/scenes/{scene_id}/physics/constraints
```

Create a new physics constraint.

**Request Body:**
```json
{
  "name": "string",
  "constraint_type": "distance|revolute|prismatic",
  "object_a_id": "number",
  "object_b_id": "number",
  "anchor_a": {
    "x": "number",
    "y": "number"
  },
  "anchor_b": {
    "x": "number",
    "y": "number"
  },
  "stiffness": "number",
  "damping": "number",
  "properties": {
    // For distance constraint:
    "min_length": "number|null",
    "max_length": "number|null",
    // For revolute constraint:
    "angle_limits": {
      "min": "number",
      "max": "number"
    },
    // For prismatic constraint:
    "axis": {
      "x": "number",
      "y": "number"
    },
    "translation_limits": {
      "min": "number",
      "max": "number"
    }
  }
}
```

**Response:**
```json
{
  "id": "number",
  "scene_id": "number",
  // ... all constraint properties
}
```

### Get Physics Constraint
```http
GET /api/scenes/{scene_id}/physics/constraints/{constraint_id}
```

Retrieve a specific physics constraint.

**Response:**
```json
{
  "id": "number",
  "scene_id": "number",
  // ... all constraint properties
}
```

### Update Physics Constraint
```http
PUT /api/scenes/{scene_id}/physics/constraints/{constraint_id}
```

Update an existing physics constraint.

**Request Body:**
```json
{
  // Any updatable constraint properties
}
```

**Response:**
```json
{
  "id": "number",
  "scene_id": "number",
  // ... all constraint properties
}
```

### Delete Physics Constraint
```http
DELETE /api/scenes/{scene_id}/physics/constraints/{constraint_id}
```

Delete a physics constraint.

**Response:** 204 No Content

## Physics Simulation

### Start Simulation
```http
POST /api/scenes/{scene_id}/physics/simulate/start
```

Start the physics simulation for a scene.

**Response:**
```json
{
  "status": "running",
  "timestamp": "string"
}
```

### Stop Simulation
```http
POST /api/scenes/{scene_id}/physics/simulate/stop
```

Stop the physics simulation.

**Response:**
```json
{
  "status": "stopped",
  "timestamp": "string"
}
```

### Step Simulation
```http
POST /api/scenes/{scene_id}/physics/simulate/step
```

Advance the simulation by one time step.

**Response:**
```json
{
  "objects": [
    {
      "id": "number",
      "position": {
        "x": "number",
        "y": "number"
      },
      "angle": "number"
      // ... other updated properties
    }
  ]
}
```

### Get Simulation State
```http
GET /api/scenes/{scene_id}/physics/simulate/state
```

Get the current state of the physics simulation.

**Response:**
```json
{
  "status": "running|stopped",
  "timestamp": "string",
  "objects": [
    {
      "id": "number",
      "position": {
        "x": "number",
        "y": "number"
      },
      "angle": "number"
      // ... other state properties
    }
  ]
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "string",
  "details": {
    // Validation error details
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "retry_after": "number"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

Last updated: Thu Jan 30 18:37:48 CST 2025
