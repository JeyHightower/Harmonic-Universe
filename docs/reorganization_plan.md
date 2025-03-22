# Harmonic Universe Project Reorganization Plan

## Current Issues
- Multiple backup and duplicate files
- Nested directories with similar functionality
- Mix of Flask, Flask-SQLAlchemy, and FastAPI in backend
- Unclear separation of frontend React/Redux components

## Reorganization Plan

### 1. Clean Three-Directory Structure

```
harmonic-universe/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py
│   │   │   │   ├── universe.py
│   │   │   │   ├── scene.py
│   │   │   │   ├── physics_objects.py
│   │   │   │   └── physics_parameters.py
│   │   ├── models/
│   │   │   ├── universe/
│   │   │   │   ├── universe.py
│   │   │   │   └── scene.py
│   │   │   ├── physics/
│   │   │   │   ├── physics_object.py
│   │   │   │   └── physics_parameter.py
│   │   │   └── user/
│   │   │       └── user.py
│   │   ├── services/
│   │   ├── utils/
│   │   └── app.py
│   ├── migrations/
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── universe/
│   │   │   ├── scene/
│   │   │   ├── physics/
│   │   │   └── auth/
│   │   ├── store/
│   │   │   ├── slices/
│   │   │   ├── thunks/
│   │   │   └── index.js
│   │   ├── styles/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
└── package.json
```

### 2. Implementation Plan

1. Create the clean directory structure
2. Implement core backend features:
   - Universe Management CRUD
   - Scene Management CRUD
   - Physics Objects CRUD
   - Physics Parameters CRUD

3. Implement frontend features:
   - Universe management components and redux store
   - Scene management components and redux store
   - Physics Objects components and redux store
   - Physics Parameters components and redux store
   - Modal system for all CRUD operations

4. Test all features with curl commands
5. Implement clean, professional CSS

### 3. Implementation Steps

#### Backend
1. Set up Flask with SQLAlchemy
2. Create models for all 4 features
3. Create API routes for all CRUD operations
4. Implement authentication

#### Frontend
1. Set up React/Redux structure
2. Create redux slices and thunks for API calls
3. Implement components for each feature
4. Create modal components for CRUD operations
5. Add styling

### 4. Features to Implement

1. **Universe Management**
   - Create, Read, Update, Delete universes
   - List all universes
   - View universe details

2. **Scene Management**
   - Create, Read, Update, Delete scenes within a universe
   - List all scenes
   - View scene details

3. **Physics Objects**
   - Create, Read, Update, Delete physics objects
   - Associate physics objects with scenes
   - Configure physics object properties

4. **Physics Parameters**
   - Create, Read, Update, Delete physics parameters
   - Apply parameters to physics objects
   - Adjust parameter values

All features will have a complete modal system for CRUD operations and a clean, professional UI.