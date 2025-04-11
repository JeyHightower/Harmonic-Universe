# Scene Feature

This directory contains all scene-related components for the Harmonic Universe application.

## Directory Structure

```
scene/
├── components/              # Scene component pieces
│   ├── SceneCard.jsx        # Card component for scene lists
│   ├── SceneCardSimple.jsx  # Simplified card for scene lists
│   ├── SceneViewer.jsx      # Component for viewing a scene
│   ├── ScenesList.jsx       # Component for displaying lists of scenes
│   └── ScenesExample.jsx    # Example component for scenes usage
├── modals/                  # Scene modal components
│   ├── SceneModal.jsx       # Modal for creating/editing scenes
│   └── SceneDeleteConfirmation.jsx # Confirmation modal for scene deletion
├── pages/                   # Scene page components
│   ├── SceneDetail.jsx      # Scene detail page
│   ├── SceneEditPage.jsx    # Scene editing page
│   ├── SceneForm.jsx        # Scene form page
│   └── SceneList.jsx        # Scene list page 
├── index.js                 # Exports all scene components
└── README.md                # This documentation
```

## Components

### Scene Components

- **SceneCard**: Displays a scene in a card format
- **SceneCardSimple**: Simplified card component for lists
- **SceneViewer**: Component for viewing scenes
- **ScenesList**: Component for displaying lists of scenes
- **ScenesExample**: Example component for scene usage

### Scene Modals

- **SceneModal**: Modal for creating, editing, and viewing scenes
- **SceneDeleteConfirmation**: Confirmation modal for scene deletion

### Scene Pages

- **SceneDetail**: Detailed view of a scene
- **SceneEditPage**: Page for editing scene content 
- **SceneForm**: Form for editing scene details
- **SceneList**: List page for scenes

## Usage Examples

```jsx
// Import specific components
import { SceneList, SceneDetail, SceneModal } from '../components/features/scene';

// Using scene list and detail
const MyComponent = () => (
  <div>
    <SceneList universeId={universeId} />
    <SceneDetail sceneId={sceneId} />
  </div>
);

// Using the modal
import { SceneModal } from '../components/features/scene';

const MyComponent = () => {
  const [modalOpen, setModalOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setModalOpen(true)}>Create Scene</button>
      <SceneModal 
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode="create"
        universeId={universeId}
      />
    </>
  );
};
```

## Dependencies

This feature depends on:
- Universe feature for universe context and data
- Character feature for linking characters to scenes
- Common components for UI elements

## API

### SceneModal Props
- `open`: Boolean - Whether the modal is open
- `onClose`: Function - Called when modal is closed
- `mode`: String - 'create', 'edit', or 'view'
- `universeId`: String - ID of the universe
- `sceneId`: String - ID of the scene (required for edit/view modes)
- `onSuccess`: Function - Called on successful operation
