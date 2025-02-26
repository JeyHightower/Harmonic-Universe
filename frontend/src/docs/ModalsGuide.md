# Harmonic Universe Modal System

This document provides a comprehensive guide to the modal system in the Harmonic Universe application.

## Table of Contents

1. [Basic Modal Component](#basic-modal-component)
2. [Global Modal System](#global-modal-system)
3. [Size Variants](#size-variants)
4. [Type Variants](#type-variants)
5. [Position Variants](#position-variants)
6. [Animation Variants](#animation-variants)
7. [Stacked Modals](#stacked-modals)
8. [Draggable Modals](#draggable-modals)
9. [Helper Functions](#helper-functions)
10. [Usage Examples](#usage-examples)

## Basic Modal Component

The `Modal` component is the foundation of the modal system. It can be used directly for simple modal functionality or through the global modal system for more advanced features.

### Props

| Prop                   | Type     | Default   | Description                                         |
| ---------------------- | -------- | --------- | --------------------------------------------------- |
| `isOpen`               | boolean  | Required  | Controls modal visibility                           |
| `onClose`              | function | Required  | Function called when modal close is triggered       |
| `title`                | string   | Required  | Modal title displayed in the header                 |
| `children`             | node     | Required  | Content to display inside the modal                 |
| `size`                 | string   | 'medium'  | Size variant: 'small', 'medium', 'large', 'full'    |
| `type`                 | string   | 'default' | Type variant: 'default', 'alert', 'confirm', 'form' |
| `animation`            | string   | 'fade'    | Animation variant: 'fade', 'slide', 'zoom', 'none'  |
| `position`             | string   | 'center'  | Position variant: 'center', 'top', 'bottom'         |
| `showCloseButton`      | boolean  | true      | Whether to show the close button in header          |
| `preventBackdropClick` | boolean  | false     | Prevents closing modal by clicking backdrop         |
| `contentClassName`     | string   | ''        | Additional classes for modal content                |
| `footerContent`        | node     | null      | Content to display in modal footer                  |

### Basic Usage

```jsx
import { useState } from 'react';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <Button onClick={openModal}>Open Modal</Button>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Example Modal">
        <p>This is the modal content.</p>
      </Modal>
    </>
  );
}
```

## Global Modal System

The global modal system allows you to open modals from anywhere in the application without managing modal state in each component.

### Setup

The application is already set up with the `ModalProvider` in the root App component. This provides the global modal context to all components.

### useModal Hook

The `useModal` hook provides access to the global modal functions:

- `openModal(config)`: Opens a new modal
- `closeModal(id)`: Closes a specific modal by ID
- `closeAllModals()`: Closes all open modals
- `updateModal(id, data)`: Updates an existing modal
- `modals`: Array of currently open modals

### Basic Usage

```jsx
import { useModal } from '../../contexts/ModalContext';
import Button from '../components/common/Button';

function MyComponent() {
  const { openModal } = useModal();

  const handleOpenModal = () => {
    openModal({
      component: MyModalContent,
      props: { foo: 'bar' },
      modalProps: {
        title: 'My Modal',
        size: 'medium',
        type: 'default',
        animation: 'fade',
        position: 'center',
      },
    });
  };

  return <Button onClick={handleOpenModal}>Open Modal</Button>;
}

function MyModalContent({ foo, onClose }) {
  return (
    <div>
      <p>Modal content with {foo}</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

## Size Variants

The modal system supports four size variants:

- **Small**: For simple messages or confirmations (400px max-width)
- **Medium**: Default size for most content (550px max-width)
- **Large**: For more complex forms or content (800px max-width)
- **Full**: Fullscreen on mobile, large on desktop (95% width, 95vh height)

### Example

```jsx
const { openModal } = useModal();

// Open a small modal
openModal({
  component: MyComponent,
  modalProps: {
    title: 'Small Modal',
    size: 'small',
  },
});

// Open a large modal
openModal({
  component: MyComponent,
  modalProps: {
    title: 'Large Modal',
    size: 'large',
  },
});
```

## Type Variants

The modal system supports four type variants:

- **Default**: Standard modal appearance
- **Alert**: Modal with alert styling (warning color accent)
- **Confirm**: Modal with confirmation styling (info color accent)
- **Form**: Modal optimized for form content (primary color accent)

## Position Variants

The modal system supports three position variants:

- **Center**: Modal centered in viewport (default)
- **Top**: Modal positioned at top of viewport
- **Bottom**: Modal positioned at bottom of viewport

## Animation Variants

The modal system supports four animation variants:

- **Fade**: Simple fade in/out (default)
- **Slide**: Slide in from bottom, slide out to bottom
- **Zoom**: Zoom in/out with fade effect
- **None**: No animation (for performance concerns)

## Stacked Modals

The modal system supports stacked modals (opening a modal from within another modal). The system:

- Maintains proper z-index stacking
- Shows visual indicator for stacked modals
- Manages focus and keyboard navigation correctly
- Only locks body scroll once for all modals

## Draggable Modals

The modal system includes a `DraggableModal` component that allows users to drag the modal around the screen by its header.

### Usage

```jsx
import { useState } from 'react';
import DraggableModal from '../components/common/DraggableModal';
import Button from '../components/common/Button';

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <Button onClick={openModal}>Open Draggable Modal</Button>

      <DraggableModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Draggable Modal"
      >
        <p>Click and drag the header to move this modal around the screen!</p>
      </DraggableModal>
    </>
  );
}
```

### Features

- Drag the modal by clicking and holding on the modal header
- Modal maintains its dragged position until closed
- Useful when users need to compare information between modal content and the page behind it
- Visual indicator in the modal header shows that the modal is draggable
- Resets position when reopened

## Helper Functions

The modal system includes helper functions for common modal types:

### createAlertModal

```jsx
const { openModal } = useModal();

openModal(
  createAlertModal('This is an alert message', {
    title: 'Alert Title',
    size: 'small',
    animation: 'fade',
    position: 'center',
  })
);
```

### createConfirmModal

```jsx
const { openModal } = useModal();

openModal(
  createConfirmModal(
    'Are you sure you want to proceed?',
    () => {
      // Confirmation handler
      console.log('Confirmed');
    },
    {
      title: 'Please Confirm',
      confirmText: 'Yes, Proceed',
      cancelText: 'Cancel',
      isDestructive: false,
      size: 'small',
      animation: 'fade',
    }
  )
);
```

### createFormModal

```jsx
const { openModal } = useModal();

openModal(
  createFormModal(
    MyFormComponent,
    {
      onSubmit: handleSubmitForm,
      initialData: { name: 'John' },
      isSubmitting: false,
    },
    {
      title: 'Edit Profile',
      submitText: 'Save Changes',
      cancelText: 'Cancel',
      size: 'medium',
      animation: 'slide',
    }
  )
);
```

## Usage Examples

For more comprehensive examples, see the `ModalExample.jsx` component which demonstrates all features of the modal system.

### Example: Delete Confirmation

```jsx
import { useModal } from '../../contexts/ModalContext';
import { createConfirmModal } from '../../utils/modalHelpers';
import Button from '../components/common/Button';

function DeleteButton({ itemId, itemName }) {
  const { openModal } = useModal();

  const handleDelete = () => {
    openModal(
      createConfirmModal(
        `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
        async () => {
          try {
            // Delete API call
            await deleteItem(itemId);

            // Show success message
            openModal(createAlertModal('Item deleted successfully'));
          } catch (error) {
            openModal(createAlertModal(`Error: ${error.message}`));
          }
        },
        {
          title: 'Delete Item',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          isDestructive: true,
        }
      )
    );
  };

  return (
    <Button variant="danger" onClick={handleDelete}>
      Delete
    </Button>
  );
}
```
