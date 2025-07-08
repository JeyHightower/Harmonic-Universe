# Frontend Auth Architecture & CRUD Flow Guide

## Key Files and Their Roles

### 1. `http-client.mjs`

- **Purpose:** Core HTTP utility for all API requests (GET, POST, PUT, DELETE, etc.).
- **Features:** Handles base URLs, authentication headers, CORS, retries, caching, and error handling.
- **Usage:** All service files use this to communicate with the backend.

### 2. `authActions.mjs`

- **Purpose:** Defines Redux action creators for authentication (login, logout, update user, etc.).
- **Features:** Synchronous actions that describe what happened (e.g., login started, login succeeded, login failed).
- **Usage:** Used by thunks and reducers to update the Redux store.

### 3. `auth.service.mjs`

- **Purpose:** Contains the business logic for authentication (login, logout, register, token validation, etc.).
- **Features:** Talks to the backend via `http-client.mjs`, manages tokens in localStorage, and provides utility methods for authentication.
- **Usage:** Called by thunks to perform actual authentication work.

### 4. `authThunks.mjs`

- **Purpose:** Contains Redux async thunks for authentication (login, logout, register, token refresh, etc.).
- **Features:** Orchestrates async flows: calls service methods, dispatches actions, handles errors.
- **Usage:** Bridges UI events and service logic, updates Redux state via actions.

### 5. `authSlice.mjs`

- **Purpose:** Redux slice that manages authentication state (user, token, loading, error, etc.).
- **Features:** Contains reducers and extraReducers to handle actions and thunks, and exposes selectors.
- **Usage:** The single source of truth for authentication state in the Redux store.

---

## How They Work Together

1. **User triggers an auth event** (e.g., login form submit).
2. **Component dispatches a thunk** from `authThunks.mjs` (e.g., `dispatch(login(credentials))`).
3. **Thunk calls a service method** from `auth.service.mjs` (e.g., `authService.login(credentials)`).
4. **Service uses `http-client.mjs`** to make the API call.
5. **Thunk dispatches actions** from `authActions.mjs` based on the result (success/failure).
6. **Reducers in `authSlice.mjs`** update the Redux state accordingly.
7. **UI reacts to state changes** (e.g., shows user info, error messages, etc.).

---

## General CRUD Flow in the Frontend

1. **Component/UI Layer**

   - User interacts with a page or modal (e.g., create, edit, delete, view).
   - Component dispatches a thunk or calls a service directly.

2. **Thunk/Service Layer**

   - Thunks (in `store/thunks/`) handle async logic, call service methods, and dispatch actions.
   - Services (in `services/`) contain business logic and use `http-client.mjs` for API calls.

3. **HTTP Layer**

   - `http-client.mjs` handles the actual HTTP request, including headers, tokens, error handling, etc.

4. **Redux State Layer**
   - Actions (in `store/actions/`) and slices (in `store/slices/`) update the Redux store.
   - Components subscribe to Redux state and re-render on changes.

---

## Specific CRUD Data Flows

### Universe CRUD Flow

**Key Files:**

- **Components:** `features/universe/components/UniverseManager.jsx`, `features/universe/modals/UniverseModal.jsx`
- **Thunks:** `store/thunks/universeThunks.mjs`
- **Service:** `services/universe.service.mjs`
- **Slice:** `store/slices/universeSlice.mjs`
- **Endpoints:** `services/endpoints.mjs` (universeEndpoints)

**Flow Pattern:**

1. **Create:** `UniverseModal` → `createUniverse` thunk → `universeService.createUniverse()` → `http-client.post('/api/universes/')`
2. **Read:** `UniverseList` → `fetchUniverses` thunk → `universeService.getAllUniverses()` → `http-client.get('/api/universes/')`
3. **Update:** `UniverseModal` → `updateUniverse` thunk → `universeService.updateUniverse()` → `http-client.put('/api/universes/{id}')`
4. **Delete:** `UniverseDeleteModal` → `deleteUniverse` thunk → `universeService.deleteUniverse()` → `http-client.delete('/api/universes/{id}')`

**Debugging Checklist:**

- Check `UniverseModal.jsx` for form validation and data formatting
- Verify `universeThunks.mjs` handles API responses correctly
- Ensure `universe.service.mjs` formats data properly for API
- Check `universeEndpoints` in `endpoints.mjs` for correct URLs

### Character CRUD Flow

**Key Files:**

- **Components:** `features/character/modals/CharacterModal.jsx`, `features/character/pages/CharactersPage.jsx`
- **Thunks:** `store/thunks/characterThunks.mjs`
- **Service:** `services/character.service.mjs`
- **Slice:** `store/slices/characterSlice.mjs`
- **Endpoints:** `services/endpoints.mjs` (characterEndpoints)

**Flow Pattern:**

1. **Create:** `CharacterModal` → `createCharacter` thunk → `characterService.createCharacter()` → `http-client.post('/api/characters')`
2. **Read:** `CharactersPage` → `fetchCharactersByUniverse` thunk → `characterService.getCharactersByUniverse()` → `http-client.get('/api/characters/universe/{id}')`
3. **Update:** `CharacterModal` → `updateCharacter` thunk → `characterService.updateCharacter()` → `http-client.put('/api/characters/{id}')`
4. **Delete:** `CharacterModal` → `deleteCharacter` thunk → `characterService.deleteCharacter()` → `http-client.delete('/api/characters/{id}')`

**Debugging Checklist:**

- Check `CharacterModal.jsx` for scene selection and universe association
- Verify `characterThunks.mjs` handles demo mode and caching
- Ensure `character.service.mjs` validates required fields (universeId, name)
- Check character endpoints for proper URL formatting

### Note CRUD Flow

**Key Files:**

- **Components:** `features/note/modals/NoteFormModal.jsx`, `features/note/pages/NotesPage.jsx`
- **Thunks:** `store/thunks/noteThunks.mjs`
- **Service:** `services/note.service.mjs`
- **Slice:** `store/slices/noteSlice.mjs`
- **Endpoints:** `services/endpoints.mjs` (noteEndpoints)

**Flow Pattern:**

1. **Create:** `NoteFormModal` → `createNote` thunk → `noteService.createNote()` → `http-client.post('/api/notes')`
2. **Read:** `NotesPage` → `fetchNotesByUniverse/Scene/Character` thunk → `noteService.getNotesBy*()` → `http-client.get('/api/notes/*/{id}')`
3. **Update:** `NoteFormModal` → `updateNote` thunk → `noteService.updateNote()` → `http-client.put('/api/notes/{id}')`
4. **Delete:** `NoteFormModal` → `deleteNote` thunk → `noteService.deleteNote()` → `http-client.delete('/api/notes/{id}')`

**Debugging Checklist:**

- Check `NoteFormModal.jsx` for tag handling and parent entity association
- Verify `noteThunks.mjs` handles different parent types (universe, scene, character)
- Ensure `note.service.mjs` validates content and parent entity requirements
- Check note endpoints for proper filtering by parent entity

### Scene CRUD Flow

**Key Files:**

- **Components:** `features/scene/modals/SceneModal.jsx`, `features/scene/pages/SceneForm.jsx`
- **Thunks:** `store/thunks/consolidated/scenesThunks.mjs`
- **Service:** `services/scene.service.mjs`
- **Slice:** `store/slices/sceneSlice.mjs`
- **Endpoints:** `services/endpoints.mjs` (sceneEndpoints)

**Flow Pattern:**

1. **Create:** `SceneModal` → `createSceneAndRefresh` thunk → `sceneService.createScene()` → `http-client.post('/api/scenes/')`
2. **Read:** `ScenesPage` → `fetchScenesByUniverse` thunk → `sceneService.getScenesByUniverse()` → `http-client.get('/api/scenes/universe/{id}')`
3. **Update:** `SceneModal` → `updateSceneAndRefresh` thunk → `sceneService.updateScene()` → `http-client.put('/api/scenes/{id}')`
4. **Delete:** `SceneModal` → `deleteSceneAndRefresh` thunk → `sceneService.deleteScene()` → `http-client.delete('/api/scenes/{id}')`

**Debugging Checklist:**

- Check `SceneModal.jsx` for form validation and data transformation
- Verify `scenesThunks.mjs` handles complex scene data formatting
- Ensure `scene.service.mjs` properly converts camelCase to snake_case
- Check scene endpoints for proper universe association
- Verify scene ID handling (string vs integer conversion)

---

## Debugging Guide: Major Files to Check

| Layer        | Major Files/Dirs                  | What to Check For              |
| ------------ | --------------------------------- | ------------------------------ |
| UI/Component | `features/`, `components/`        | Dispatches, props, rendering   |
| Thunks       | `store/thunks/`                   | Async logic, service calls     |
| Services     | `services/`                       | API calls, business logic      |
| HTTP Client  | `services/http-client.mjs`        | Network, headers, CORS, tokens |
| Redux State  | `store/slices/`, `store/actions/` | State shape, reducers, actions |
| Endpoints    | `services/endpoints.mjs`          | Correct URLs                   |

### If Something Is Wrong:

- **Check the component** for correct dispatches and state usage.
- **Check the thunk** for correct async logic and error handling.
- **Check the service** for correct API calls and data handling.
- **Check the HTTP client** for network issues, CORS, or token problems.
- **Check the slice** for state updates and error propagation.
- **Check the backend API** if the frontend is working as expected but data is wrong.

---

## Summary

- Start at the component, follow the thunk, check the service, inspect the HTTP client, and verify the slice and actions.
- This layered approach will help you quickly identify and resolve issues in your frontend CRUD features and authentication flows.
- Each CRUD type follows the same general pattern but has specific considerations for data formatting, validation, and parent entity relationships.
