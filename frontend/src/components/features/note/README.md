# Note Feature

This directory contains all note-related components for the Harmonic Universe application.

## Directory Structure

```
note/
├── components/              # Note component pieces
│   ├── NoteCard.jsx         # Card component for note lists
│   └── NoteList.jsx         # List of notes
├── modals/                  # Note modal components
│   └── NoteFormModal.jsx    # Modal for creating/editing notes
├── pages/                   # Note page components
│   ├── NoteDetail.jsx       # Note detail page
│   └── NoteForm.jsx         # Note form page
├── styles/                  # Note CSS
│   ├── NoteCard.css         # Note card styles
│   ├── NoteList.css         # Note list styles
│   ├── NoteDetail.css       # Note detail styles
│   ├── NoteForm.css         # Note form styles
│   └── NoteFormModal.css    # Note form modal styles
├── index.js                 # Exports all note components
└── README.md                # This documentation
```

## Components

### Note Components

- **NoteCard**: Displays a note in a card format
- **NoteList**: Displays a list of notes

### Note Modals

- **NoteFormModal**: Modal for creating, editing, and viewing notes

### Note Pages

- **NoteDetail**: Detailed view of a note
- **NoteForm**: Form for editing note details

## Usage Examples

```jsx
// Import specific components
import { NoteList, NoteCard, NoteForm } from '../components/features/note';

// Using components in your JSX
const MyComponent = () => (
  <div>
    <NoteList universeId={universeId} />
    <NoteDetail noteId={noteId} />
  </div>
);

// Using the modal
import { NoteFormModal } from '../components/features/note';

const MyComponent = () => {
  const [modalOpen, setModalOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setModalOpen(true)}>Create Note</button>
      <NoteFormModal 
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
- Scene feature for linking notes to scenes
- Character feature for linking notes to characters 
- Common components for UI elements

## API

### NoteFormModal Props
- `open`: Boolean - Whether the modal is open
- `onClose`: Function - Called when modal is closed
- `mode`: String - 'create', 'edit', or 'view'
- `universeId`: String - ID of the universe
- `sceneId`: String - Optional ID of the scene
- `characterId`: String - Optional ID of the character
- `noteId`: String - ID of the note (required for edit/view modes)
- `onSuccess`: Function - Called on successful operation 