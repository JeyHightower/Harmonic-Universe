# Redux Store Organization

This directory contains the Redux store implementation for the Harmonic Universe application.

## Directory Structure

```
store/
├── index.js             # Main entry point for Redux exports
├── store.js             # Store configuration with middleware
├── slices/              # Redux slices using Redux Toolkit createSlice
│   ├── authSlice.js     # User authentication state
│   ├── characterSlice.js # Character management
│   ├── modalSlice.js    # UI modal state
│   ├── noteSlice.js     # Notes management
│   ├── physicsObjectsSlice.js # Physics objects
│   ├── physicsParametersSlice.js # Physics parameters
│   ├── scenesSlice.js   # Scene management
│   └── universeSlice.js # Universe management
├── thunks/              # Async thunk actions
│   ├── index.js         # Entry point for all thunks
│   ├── authThunks.js    # Authentication-related async actions
│   ├── characterThunks.js # Character-related async actions
│   ├── noteThunks.js    # Notes-related async actions
│   ├── physicsObjectsThunks.js # Physics objects-related async actions
│   ├── universeThunks.js # Universe-related async actions
│   └── consolidated/    # Consolidated/reorganized thunks
│       ├── index.js     # Entry point for consolidated thunks
│       └── scenesThunks.js # Scene-related async actions
└── selectors/           # Redux selectors for computed state
    └── universeSelectors.js # Universe-related selectors
```

## Usage

Import components from the main index.js file:

```javascript
import { store, fetchScenes, addScene, updateCharacter } from "../store";
```

## Slices

Each slice is responsible for a specific domain of the application state and includes:

- Initial state
- Reducer functions for synchronous updates
- Extra reducers for handling async thunk actions

## Thunks

Async operations are implemented using Redux Toolkit's `createAsyncThunk` function. These handle:

- API calls to the backend
- Loading states
- Success and error handling
- Data normalization

## Selectors

Selectors are used to derive computed data from the store state. They help with:

- Memoization of computed values
- Extracting specific pieces of state
- Transforming state for component consumption
