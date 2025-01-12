# **Harmonic Universe API Documentation**

## **Base URL**

The base URL for the API is:

- Local development: `http://127.0.0.1:5000`
- Production: `https://api.harmonicuniverse.com/v1`

---

## **Authorization**

Authenticated endpoints require a Bearer token in the `Authorization` header:

```http
Authorization: Bearer <token>
```

---

## **Endpoints**

### **1. User Authentication**

#### **POST /auth/signup**

Creates a new user account.

#### **Signup Request Body**

```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### **Signup Response (201 Created)**

```json
{
  "message": "User created successfully",
  "userId": "string",
  "token": "string"
}
```

---

#### **POST /auth/login**

Authenticates a user and generates a token.

#### **Login Request Body**

```json
{
  "email": "string",
  "password": "string"
}
```

#### **Login Response (200 OK)**

```json
{
  "message": "Login successful",
  "token": "string"
}
```

---

### **2. User Management**

#### **GET /users/{id}**

Retrieves the user's profile.

#### **User Profile Headers**

```http
Authorization: Bearer <token>
```

#### **User Profile Response (200 OK)**

```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "created_at": "string",
  "updated_at": "string"
}
```

---

#### **PUT /users/{id}**

Updates the user profile.

#### **User Update Headers**

```http
Authorization: Bearer <token>
```

#### **User Update Request Body**

```json
{
  "username": "string",
  "email": "string"
}
```

#### **User Update Response (200 OK)**

```json
{
  "message": "User updated successfully"
}
```

---

#### **DELETE /users/{id}**

Deletes the user account.

#### **User Delete Headers**

```http
Authorization: Bearer <token>
```

#### **User Delete Response (204 No Content)**

No response body.

---

### **3. Universe Management**

#### **POST /universes**

Creates a new universe.

#### **Universe Create Headers**

```http
Authorization: Bearer <token>
```

#### **Universe Create Request Body**

```json
{
  "name": "string",
  "description": "string",
  "gravity_constant": "number",
  "environment_harmony": "number",
  "friction": "number"
}
```

#### **Universe Create Response (201 Created)**

```json
{
  "message": "Universe created successfully",
  "universeId": "string"
}
```

---

#### **GET /universes**

Retrieves all universes for the authenticated user.

#### **Universe List Headers**

```http
Authorization: Bearer <token>
```

#### **Universe List Response (200 OK)**

```json
{
  "universes": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "gravity_constant": "number",
      "environment_harmony": "number",
      "friction": "number",
      "created_at": "string",
      "updated_at": "string"
    }
  ]
}
```

---

#### **GET /universes/{id}**

Retrieves a single universe by its ID.

#### **Universe Get Headers**

```http
Authorization: Bearer <token>
```

#### **Universe Get Response (200 OK)**

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "gravity_constant": "number",
  "environment_harmony": "number",
  "friction": "number",
  "created_at": "string",
  "updated_at": "string"
}
```

---

#### **PUT /universes/{id}**

Updates a universe's settings.

#### **Universe Update Headers**

```http
Authorization: Bearer <token>
```

#### **Universe Update Request Body**

```json
{
  "name": "string",
  "description": "string",
  "gravity_constant": "number",
  "environment_harmony": "number",
  "friction": "number"
}
```

#### **Universe Update Response (200 OK)**

```json
{
  "message": "Universe updated successfully"
}
```

---

#### **DELETE /universes/{id}**

Deletes a universe.

#### **Universe Delete Headers**

```http
Authorization: Bearer <token>
```

#### **Universe Delete Response (204 No Content)**

No response body.

---

### **4. Physics Parameters**

#### **POST /universes/{universeId}/physics**

Adds a new physics parameter to a universe.

#### **Physics Create Headers**

```http
Authorization: Bearer <token>
```

#### **Physics Create Request Body**

```json
{
  "parameter_name": "string",
  "value": "number"
}
```

#### **Physics Create Response (201 Created)**

```json
{
  "message": "Physics parameter added successfully",
  "parameterId": "string"
}
```

---

#### **GET /universes/{universeId}/physics**

Retrieves all physics parameters for a universe.

#### **Physics List Headers**

```http
Authorization: Bearer <token>
```

#### **Physics List Response (200 OK)**

```json
{
  "parameters": [
    {
      "id": "string",
      "parameter_name": "string",
      "value": "number"
    }
  ]
}
```

---

#### **PUT /universes/{universeId}/physics/{parameterId}**

Updates a physics parameter.

#### **Physics Update Headers**

```http
Authorization: Bearer <token>
```

#### **Physics Update Request Body**

```json
{
  "parameter_name": "string",
  "value": "number"
}
```

#### **Physics Update Response (200 OK)**

```json
{
  "message": "Physics parameter updated successfully"
}
```

---

#### **DELETE /universes/{universeId}/physics/{parameterId}**

Deletes a physics parameter.

#### **Physics Delete Headers**

```http
Authorization: Bearer <token>
```

#### **Physics Delete Response (204 No Content)**

No response body.

---

### **5. Music Integration**

#### **POST /universes/{universeId}/music**

Adds or updates music settings for a universe.

#### **Music Update Headers**

```http
Authorization: Bearer <token>
```

#### **Music Update Request Body**

```json
{
  "tempo": "number",
  "pitch": "number",
  "instrument": "string",
  "harmony_value": "number"
}
```

#### **Music Update Response (200 OK)**

```json
{
  "message": "Music settings updated successfully"
}
```

---

#### **GET /universes/{universeId}/music**

Retrieves music settings for a universe.

#### **Music Get Headers**

```http
Authorization: Bearer <token>
```

#### **Music Get Response (200 OK)**

```json
{
  "tempo": "number",
  "pitch": "number",
  "instrument": "string",
  "harmony_value": "number"
}
```

---

### **6. Storyboards**

#### **POST /universes/{universeId}/storyboards**

Adds a new storyboard entry to a universe.

#### **Storyboard Create Headers**

```http
Authorization: Bearer <token>
```

#### **Storyboard Create Request Body**

```json
{
  "plot_point": "string",
  "description": "string",
  "harmony_tie": "number"
}
```

#### **Storyboard Create Response (201 Created)**

```json
{
  "message": "Storyboard added successfully",
  "storyboardId": "string"
}
```

---

#### **GET /universes/{universeId}/storyboards**

Retrieves all storyboards for a universe.

#### **Storyboard List Headers**

```http
Authorization: Bearer <token>
```

#### **Storyboard List Response (200 OK)**

```json
{
  "storyboards": [
    {
      "id": "string",
      "plot_point": "string",
      "description": "string",
      "harmony_tie": "number",
      "created_at": "string"
    }
  ]
}
```

---

#### **DELETE /universes/{universeId}/storyboards/{storyboardId}**

Deletes a storyboard.

#### **Storyboard Delete Headers**

```http
Authorization: Bearer <token>
```

#### **Storyboard Delete Response (204 No Content)**

No response body.

---

## **Error Responses**

### **Standard Error Responses**

| Status Code | Description           | Response Body                          |
| ----------- | --------------------- | -------------------------------------- |
| 400         | Bad Request           | `{"error": "Invalid request data"}`    |
| 401         | Unauthorized          | `{"error": "Authentication required"}` |
| 403         | Forbidden             | `{"error": "Access denied"}`           |
| 404         | Not Found             | `{"error": "Resource not found"}`      |
| 500         | Internal Server Error | `{"error": "Internal server error"}`   |
