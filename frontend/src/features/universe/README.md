# Universe Feature

This directory contains all universe-related components for the Harmonic Universe application.

## Directory Structure

```
universe/
├── components/              # Universe component pieces
│   ├── UniverseCard.jsx     # Card component for universe lists
│   ├── UniverseList.jsx     # List of universes
│   └── UniverseManager.jsx  # Universe management component
├── modals/                  # Universe modal components
│   ├── UniverseModal.jsx    # Modal for creating/editing universes
│   ├── UniverseInfoModal.jsx # Info/details modal for universes
│   └── UniverseDeleteModal.jsx # Delete confirmation modal
├── pages/                   # Universe page components
│   ├── UniverseCreate.jsx   # Universe creation page
│   ├── UniverseDetail.jsx   # Universe detail page
│   ├── UniverseDetailPage.jsx # Detailed page for a universe
│   └── UniverseEdit.jsx     # Universe editing page
├── styles/                  # Universe CSS
│   ├── Universe.css         # Main universe styles
│   ├── UniverseCard.css     # Universe card styles
│   ├── UniverseDetail.css   # Universe detail styles
│   ├── UniverseList.css     # Universe list styles
│   ├── UniverseFormModal.css # Universe form modal styles
│   └── UniverseInfoModal.css # Universe info modal styles
├── index.js                 # Exports all universe components
└── README.md                # This documentation
```

## Components

### Universe Components

- **UniverseCard**: Displays a universe in a card format
- **UniverseList**: Displays a list of universes
- **UniverseManager**: Component for managing universes

### Universe Modals

- **UniverseModal**: Modal for creating, editing, and viewing universes
- **UniverseInfoModal**: Modal for displaying universe information
- **UniverseDeleteModal**: Confirmation modal for universe deletion

### Universe Pages

- **UniverseCreate**: Page for creating a new universe
- **UniverseDetail**: Detailed view of a universe
- **UniverseDetailPage**: Enhanced detail page for universes
- **UniverseEdit**: Page for editing universe content

## Usage Examples

```jsx
// Import specific components
import { UniverseList, UniverseDetail, UniverseModal } from '../components/features/universe';

// Using universe list and detail
const MyComponent = () => (
  <div>
    <UniverseList />
    <UniverseDetail universeId={universeId} />
  </div>
);

// Using the modal
import { UniverseModal } from '../components/features/universe';

const MyComponent = () => {
  const [modalOpen, setModalOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setModalOpen(true)}>Create Universe</button>
      <UniverseModal 
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode="create"
      />
    </>
  );
};
```

## Dependencies

This feature depends on:
- Scene feature for displaying scenes within a universe
- Character feature for displaying characters within a universe
- Common components for UI elements

## API

### UniverseModal Props
- `open`: Boolean - Whether the modal is open
- `onClose`: Function - Called when modal is closed
- `mode`: String - 'create', 'edit', or 'view'
- `universeId`: String - ID of the universe (required for edit/view modes)
- `onSuccess`: Function - Called on successful operation 