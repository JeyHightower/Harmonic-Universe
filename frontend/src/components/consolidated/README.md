# Consolidated Components

This directory contains consolidated components that replace multiple similar components found elsewhere in the codebase. The goal is to reduce code duplication, improve maintainability, and standardize the component API.

## Available Components

### UniverseModalComponent

A consolidated modal for creating, editing, and viewing universes. This replaces:
- `CreateUniverseModal.jsx`
- `EditUniverseModal.jsx`
- `UniverseModal.jsx` 
- `UniverseFormModal.jsx`

#### Usage

```jsx
import { UniverseModalComponent } from '../components/consolidated';

// In your component:
const [modalOpen, setModalOpen] = useState(false);
const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', or 'view'

// Then in your JSX:
<UniverseModalComponent
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  mode={modalMode}
  universe={selectedUniverse} // Pass universe object for edit/view modes
  onSuccess={(type) => {
    console.log(`Universe ${type}d successfully`);
    // Handle success here
  }}
/>
```

### PhysicsObjectModalComponent

A consolidated modal for creating, editing, viewing, and deleting physics objects. This replaces:
- `CreatePhysicsObjectModal.jsx`
- `EditPhysicsObjectModal.jsx`
- `PhysicsObjectModal.jsx`
- `DeletePhysicsObjectModal.jsx`
- `PhysicsObjectFormModal.jsx`

#### Usage

```jsx
import { PhysicsObjectModalComponent } from '../components/consolidated';

// In your component:
const [modalOpen, setModalOpen] = useState(false);
const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view', or 'delete'

// Then in your JSX:
<PhysicsObjectModalComponent
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  mode={modalMode}
  sceneId={currentSceneId}
  objectId={selectedObjectId} // Only needed for edit, view, or delete modes
  initialData={selectedObject} // Optional: provide initial data directly
  onSuccess={(updatedObject) => {
    console.log('Physics object operation completed successfully');
    // Handle success here
  }}
/>
```

### CharacterFormModalComponent

A consolidated modal for creating, editing, viewing, and deleting characters. This replaces the original `CharacterFormModal.jsx` which was over 1000 lines long.

#### Usage

```jsx
import { CharacterFormModalComponent } from '../components/consolidated';

// In your component:
const [modalOpen, setModalOpen] = useState(false);
const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view', or 'delete'

// Then in your JSX:
<CharacterFormModalComponent
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  mode={modalMode}
  universeId={currentUniverseId}
  characterId={selectedCharacterId} // Only needed for edit, view, or delete modes
  sceneId={optionalSceneId} // Optional: pre-select a scene
  availableScenes={optionalScenesList} // Optional: provide scenes directly
  onSuccess={(character) => {
    console.log('Character operation completed successfully');
    // Handle success here
  }}
/>
```

### SceneModalComponent

A consolidated modal for creating, editing, and viewing scenes. This replaces:
- `CreateSceneModal.jsx`
- `EditSceneModal.jsx`
- `SceneModal.jsx`
- `SceneFormModal.jsx`

#### Usage

```jsx
import { SceneModalComponent } from '../components/consolidated';

// In your component:
const [modalOpen, setModalOpen] = useState(false);
const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', or 'view'

// Then in your JSX:
<SceneModalComponent
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  mode={modalMode}
  scene={selectedScene} // Pass scene object for edit/view modes
  onSuccess={(type) => {
    console.log(`Scene ${type}d successfully`);
    // Handle success here
  }}
/>
```

### MusicModalComponent

A consolidated modal for creating, editing, viewing, deleting, and generating music. This replaces:
- `MusicModal.jsx`
- `MusicGenerationModal.jsx`

#### Usage

```jsx
import { MusicModalComponent } from '../components/consolidated';

// In your component:
const [modalOpen, setModalOpen] = useState(false);
const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view', 'delete', or 'generate'

// Then in your JSX:
<MusicModalComponent
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  mode={modalMode}
  universeId={currentUniverseId}
  musicId={selectedMusicId} // Only needed for edit, view, or delete modes
  initialData={initialMusicData} // Optional: provide initial data directly
  onSuccess={(data, operation) => {
    console.log(`Music ${operation} operation completed successfully`);
    // Handle success here
  }}
/>
```

## How to Contribute

When adding new consolidated components:

1. Create the component file in this directory
2. Export it in the `index.js` file
3. Document it in this README
4. Update imports in files that used the original components
5. Remove the original duplicate components once all references are updated

## Refactoring Guidelines

When consolidating components:

1. Maintain all functionality from the original components
2. Create a clear, flexible API that can handle all use cases
3. Document props thoroughly with JSDoc comments
4. Use mode/type props to control component behavior rather than creating separate components
5. Extract utility functions and constants to appropriate utility files
6. Ensure good performance through proper use of React hooks and memoization 

/**
 * Consolidated Components Index
 * 
 * This file exports all consolidated components to simplify imports
 * and provide a central place to manage component exports.
 */

// Universe Components
export { default as UniverseModalComponent } from './UniverseModalComponent';

// Physics Components
export { default as PhysicsObjectModalComponent } from './PhysicsObjectModalComponent';

// Character Components
export { default as CharacterFormModalComponent } from './CharacterFormModalComponent';

// Scene Components
export { default as SceneModalComponent } from './SceneModalComponent';

// Music Components
export { default as MusicModalComponent } from './MusicModalComponent';

// Add more consolidated component exports here as they are created 