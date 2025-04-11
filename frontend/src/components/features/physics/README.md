# Physics Feature

This directory contains all physics-related components for the Harmonic Universe application.

## Directory Structure

```
physics/
├── components/              # Physics component pieces
│   ├── PhysicsObjectForm.jsx # Form for physics objects
│   ├── PhysicsObjectsList.jsx # List of physics objects
│   ├── PhysicsObjectsManager.jsx # Manager for physics objects
│   ├── PhysicsPanel.jsx     # Main physics panel
│   └── PhysicsParametersManager.jsx # Manager for physics parameters 
├── modals/                  # Physics modal components
│   ├── PhysicsObjectModal.jsx # Modal for physics objects
│   ├── PhysicsParametersModal.jsx # Modal for physics parameters
│   ├── PhysicsSettingsModal.jsx # Modal for physics settings
│   └── PhysicsConstraintModal.jsx # Modal for physics constraints
├── pages/                   # Physics page components
│   ├── PhysicsEditor.jsx    # Physics editor page
│   └── PhysicsPage.jsx      # Main physics page
├── styles/                  # Physics CSS
│   ├── PhysicsObjects.css   # Physics objects styles
│   ├── PhysicsParameters.css # Physics parameters styles
│   ├── PhysicsPanel.css     # Physics panel styles
│   ├── PhysicsPage.css      # Physics page styles
│   └── Universe.css         # Universe styles for physics
├── index.js                 # Exports all physics components
└── README.md                # This documentation
```

## Components

### Physics Components

- **PhysicsObjectForm**: Form for creating and editing physics objects
- **PhysicsObjectsList**: Displays a list of physics objects
- **PhysicsObjectsManager**: Manager for physics objects
- **PhysicsPanel**: Main physics interface panel
- **PhysicsParametersManager**: Manager for physics parameters

### Physics Modals

- **PhysicsObjectModal**: Modal for creating, editing, and viewing physics objects
- **PhysicsParametersModal**: Modal for editing physics parameters
- **PhysicsSettingsModal**: Modal for physics settings
- **PhysicsConstraintModal**: Modal for physics constraints

### Physics Pages

- **PhysicsEditor**: Advanced editor for physics
- **PhysicsPage**: Main physics page

## Usage Examples

```jsx
// Import specific components
import { PhysicsPanel, PhysicsEditor } from '../components/features/physics';

// Using components in your JSX
const MyComponent = () => (
  <div>
    <PhysicsPanel sceneId={sceneId} />
  </div>
);

// Using the modal
import { PhysicsObjectModal } from '../components/features/physics';

const MyComponent = () => {
  const { openModalByType } = useModal();
  
  const handleOpenModal = () => {
    openModalByType(MODAL_TYPES.PHYSICS_OBJECT, {
      sceneId,
      onSuccess: () => {
        // Handle success
      }
    });
  };
  
  return (
    <button onClick={handleOpenModal}>
      Add Physics Object
    </button>
  );
};
```

## Dependencies

This feature depends on:
- Scene feature for linking physics to scenes
- Universe feature for universe context
- Common components for UI elements

## API

### PhysicsObjectModal Props
- `sceneId`: String - ID of the scene
- `objectId`: String - ID of the physics object (for edit/view)
- `initialData`: Object - Initial data for the object
- `readOnly`: Boolean - Whether the modal is in view mode
- `onSuccess`: Function - Called on successful operation

### PhysicsPanel Props
- `sceneId`: String - ID of the scene to manage physics for
- `onParametersChange`: Function - Called when physics parameters change 