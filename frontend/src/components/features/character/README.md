# Character Feature

This directory contains all character-related components for the Harmonic Universe application.

## Directory Structure

```
character/
├── components/              # Character component pieces
│   ├── CharacterCard.jsx    # Card component for character lists
│   ├── CharacterList.jsx    # List of characters
│   └── CharacterSelector.jsx # Component for selecting characters
├── modals/                  # Character modal components
│   └── CharacterModal.jsx   # Modal for creating/editing characters
├── pages/                   # Character page components
│   ├── CharacterDetail.jsx  # Character detail page
│   ├── CharacterForm.jsx    # Character form page
│   └── CharacterManagement.jsx # Character management page
├── styles/                  # Character CSS
│   └── Character.css        # Character styles
├── index.js                 # Exports all character components
└── README.md                # This documentation
```

## Components

### Character Components

- **CharacterCard**: Displays a character in a card format
- **CharacterList**: Displays a list of characters
- **CharacterSelector**: Component for selecting characters, used in scene forms

### Character Modals

- **CharacterModal**: Modal for creating, editing, and viewing characters

### Character Pages

- **CharacterDetail**: Detailed view of a character
- **CharacterForm**: Form for editing character details
- **CharacterManagement**: Management page for characters

## Usage Examples

```jsx
// Import specific components
import { CharacterList, CharacterDetail } from '../components/features/character';

// Use component in your JSX
const MyComponent = () => (
  <div>
    <CharacterList universeId={universeId} />
    <CharacterDetail characterId={characterId} />
  </div>
);

// Using the modal
import { CharacterModal } from '../components/features/character';

const MyComponent = () => {
  const [modalOpen, setModalOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setModalOpen(true)}>Create Character</button>
      <CharacterModal 
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
- Scene feature for linking characters to scenes
- Common components for UI elements

## API

### CharacterModal Props
- `open`: Boolean - Whether the modal is open
- `onClose`: Function - Called when modal is closed
- `mode`: String - 'create', 'edit', or 'view'
- `universeId`: String - ID of the universe
- `characterId`: String - ID of the character (required for edit/view modes)
- `onSuccess`: Function - Called on successful operation 