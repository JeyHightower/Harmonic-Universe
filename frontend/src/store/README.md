# Redux Store Organization

This directory contains the Redux store configuration, slices, thunks, and selectors for the Harmonic Universe application.

## Directory Structure

```
store/
├── slices/           # Redux Toolkit slices for state management
├── thunks/           # Async thunks for API calls and side effects
├── selectors/        # Selectors for accessing and computing state
├── index.js          # Main store exports
└── store.js          # Store configuration
```

## Redux Toolkit

This application uses Redux Toolkit to simplify Redux development. Key concepts:

- **Slices**: Combines reducers, actions, and action creators into a single file
- **Thunks**: Handles asynchronous operations like API calls
- **Selectors**: Functions to extract specific pieces of state

## Slices

Each slice represents a domain or feature of the application. Slices include:

- `authSlice.js` - Authentication state
- `characterSlice.js` - Character management
- `noteSlice.js` - Notes management
- `physicsObjectsSlice.js` - Physics objects state
- `physicsParametersSlice.js` - Physics parameters state
- `scenesSlice.js` - Scenes management
- `universeSlice.js` - Universe management

Slices should follow this organization:

1. Initial state
2. Slice definition with reducers
3. Extra reducers for handling async thunks
4. Export actions
5. Export reducer

## Thunks

Thunks handle asynchronous operations, primarily API calls. They're organized by feature in the `thunks/` directory.

Key thunk files:

- `authThunks.js` - Authentication operations
- `characterThunks.js` - Character CRUD operations
- `noteThunks.js` - Note management operations
- `physicsObjectsThunks.js` - Physics object operations
- `scenesThunks.js` - Scene management operations
- `universeThunks.js` - Universe management operations

## Selectors

Selectors provide a way to extract specific pieces of state from the Redux store, potentially with memoization for performance.

## Usage Guidelines

### Creating a New Slice

1. Create a new file in the `slices/` directory named after your feature (e.g., `featureSlice.js`)
2. Define the initial state
3. Create the slice with reducers
4. Export the actions and reducer

```javascript
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Initial state properties
};

const featureSlice = createSlice({
  name: "feature",
  initialState,
  reducers: {
    // Reducers
  },
  extraReducers: (builder) => {
    // Handle async thunks
  },
});

export const { action1, action2 } = featureSlice.actions;
export default featureSlice.reducer;
```

### Creating a New Thunk

1. Create a new file in the `thunks/` directory (or add to existing one)
2. Import `createAsyncThunk` from Redux Toolkit
3. Define your thunk functions for async operations

```javascript
import { createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../services/api";

export const fetchData = createAsyncThunk(
  "feature/fetchData",
  async (params, { dispatch, rejectWithValue }) => {
    try {
      const response = await apiClient.get("/api/endpoint");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
```

### Connecting to React Components

Use the `useSelector` and `useDispatch` hooks to connect your components to the Redux store.

```javascript
import { useSelector, useDispatch } from 'react-redux';
import { fetchData } from '../store/thunks/featureThunks';

const MyComponent = () => {
  const dispatch = useDispatch();
  const data = useSelector((state) => state.feature.data);

  useEffect(() => {
    dispatch(fetchData());
  }, [dispatch]);

  return (
    // Component JSX
  );
};
```
