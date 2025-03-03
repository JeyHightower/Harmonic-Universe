# Modal Route Integration Guide

This guide explains how to use the enhanced routing features for modals in our application.

## Benefits of Modal Route Integration

1. **Deep Linking**: Users can bookmark or share links that open specific modals
2. **Browser History**: Forward and back buttons work correctly with modals
3. **State Persistence**: Modal state can be preserved in the URL
4. **Consistent UX**: Navigation feels natural and consistent with web standards

## Modal Registry System

Our application uses a modal registry system to enable deep linking and better routing integration.

### Registering Modals

Modals are registered centrally in the `modalRegistry.js` file:

```jsx
// In modalRegistry.js
export const MODAL_TYPES = {
  PHYSICS_PARAMETERS: 'physics-parameters',
  // Add more modal types as needed
};

export const ModalRegistry = () => {
  const { registerModal } = useModal();

  useEffect(() => {
    // Register PhysicsParametersModal
    registerModal(MODAL_TYPES.PHYSICS_PARAMETERS, PhysicsParametersModal, {
      getProps: data => ({
        universeId: data.universeId,
        initialData: data.initialData || null,
        // ...other props
      }),
      getModalProps: data => ({
        title: data.initialData
          ? 'Edit Physics Parameters'
          : 'Create Physics Parameters',
        size: 'medium',
        // ...other modal props
      }),
    });

    // Register more modals as needed
  }, [registerModal]);

  return null;
};
```

The registry component is then included in the application root:

```jsx
// In App.jsx
<ModalProvider>
  <ModalRegistry />
  {/* Rest of the application */}
</ModalProvider>
```

## Using Route-Integrated Modals

### Opening Modals by Type

```jsx
import { useModal } from '../contexts/ModalContext';
import { MODAL_TYPES } from '../utils/modalRegistry';

const MyComponent = () => {
  const { openModalByType } = useModal();

  const handleOpenModal = () => {
    openModalByType(
      MODAL_TYPES.PHYSICS_PARAMETERS,
      {
        universeId: '123',
        initialData: {
          /* optional data */
        },
      },
      {
        updateUrl: true, // Update URL with modal info (default: true)
        preserveState: true, // Add to browser history (default: true)
      }
    );
  };

  return <button onClick={handleOpenModal}>Open Physics Parameters</button>;
};
```

### Generating Modal URLs for Deep Linking

```jsx
import { useModal } from '../contexts/ModalContext';
import { MODAL_TYPES } from '../utils/modalRegistry';

const MyComponent = () => {
  const { getModalUrl } = useModal();

  // Generate a URL that will open the Physics Parameters modal
  const modalUrl = getModalUrl(MODAL_TYPES.PHYSICS_PARAMETERS, {
    universeId: '123',
    // Any data needed for the modal
  });

  return <a href={modalUrl}>Open Physics Parameters in New Tab</a>;
};
```

### Closing Modals with History Control

```jsx
import { useModal } from '../contexts/ModalContext';

const MyModalContent = ({ onClose }) => {
  const handleClose = () => {
    // Close with replace: true to replace current history entry
    onClose({ replace: true });

    // Or close with replace: false to add to browser history
    // onClose({ replace: false });
  };

  return (
    <div>
      <p>Modal content...</p>
      <button onClick={handleClose}>Close</button>
    </div>
  );
};
```

## URL Structure

Modals use the following URL structure when open:

```
/some/path?modal=modal-type&modalId=unique-id&modalData=base64-encoded-data
```

Example:

```
/universes/123?modal=physics-parameters&modalId=abc123&modalData=eyJ1bml2ZXJzZUlkIjoiMTIzIn0=
```

- `modal`: The registered modal type
- `modalId`: A unique identifier for the modal instance
- `modalData`: Base64-encoded JSON data containing the modal props

## Browser History Behavior

- **Forward/Back Navigation**: Modals open and close correctly when using browser navigation buttons
- **History Entries**: By default, opening a modal adds an entry to the browser history
- **Replace Options**: You can control whether actions replace the current history entry or add new ones

## Tips for Using Modal Routes

1. **Register All Modals**: Any modal that might be deep-linked should be registered
2. **Consistent Types**: Use constants for modal types to avoid typos
3. **Minimal URL Data**: Only include essential data in the URL to keep it clean
4. **Security**: Don't put sensitive information in the URL
5. **Testing**: Test modal behavior with browser navigation buttons
6. **Route Guards**: Consider adding guards for modals that require authentication

## Debugging

If you encounter issues with modal routing:

1. Check the URL to ensure parameters are correctly formatted
2. Verify that the modal is properly registered
3. Check browser console for any errors when parsing modal data
4. Test with simplified data to isolate issues
5. Verify that the component being rendered accepts the props you're passing

```

```
