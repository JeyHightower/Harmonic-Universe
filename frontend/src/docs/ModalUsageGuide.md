# Modal Usage Guide

## Overview

This guide explains how to use the standardized Modal component in the Harmonic Universe application. The application has standardized on using the `Modal.jsx` component for all modal dialogs, providing a consistent user experience and simplified development.

## Basic Usage

```jsx
import React, { useState } from 'react';
import Modal from '../components/common/Modal';

const MyComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <button onClick={openModal}>Open Modal</button>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="My Modal"
        size="medium"
        type="default"
      >
        <p>This is the modal content.</p>
      </Modal>
    </>
  );
};

export default MyComponent;
```

## Props

| Prop                   | Type     | Default   | Description                                            |
| ---------------------- | -------- | --------- | ------------------------------------------------------ |
| `isOpen`               | boolean  | required  | Controls whether the modal is visible                  |
| `onClose`              | function | required  | Function called when modal is closed                   |
| `title`                | string   | required  | Modal title displayed in the header                    |
| `children`             | node     | required  | Content to display inside the modal                    |
| `size`                 | string   | 'medium'  | Size of the modal ('small', 'medium', 'large', 'full') |
| `type`                 | string   | 'default' | Type of modal ('default', 'alert', 'confirm', 'form')  |
| `animation`            | string   | 'fade'    | Animation type ('fade', 'slide', 'zoom', 'none')       |
| `position`             | string   | 'center'  | Modal position ('center', 'top', 'bottom')             |
| `showCloseButton`      | boolean  | true      | Whether to show the close button in the header         |
| `preventBackdropClick` | boolean  | false     | If true, clicking backdrop won't close modal           |
| `contentClassName`     | string   | ''        | Additional CSS class for the modal content             |
| `footerContent`        | node     | null      | Content to display in the modal footer                 |

## Modal Types

### Default Modal

Simple modal with a title and content.

```jsx
<Modal
  isOpen={isOpen}
  onClose={closeModal}
  title="Information"
  size="small"
  type="default"
>
  <p>This is some information for the user.</p>
</Modal>
```

### Form Modal

Modal containing a form with custom footer buttons.

```jsx
<Modal
  isOpen={isOpen}
  onClose={closeModal}
  title="Edit Profile"
  size="medium"
  type="form"
  footerContent={
    <div className="modal-footer-buttons">
      <button className="button primary" onClick={handleSave}>
        Save
      </button>
      <button className="button secondary" onClick={closeModal}>
        Cancel
      </button>
    </div>
  }
>
  <form>{/* Form fields */}</form>
</Modal>
```

### Confirmation Modal

Modal asking for user confirmation.

```jsx
<Modal
  isOpen={isOpen}
  onClose={closeModal}
  title="Confirm Action"
  size="small"
  type="confirm"
  footerContent={
    <div className="modal-footer-buttons">
      <button className="button danger" onClick={confirmAction}>
        Delete
      </button>
      <button className="button secondary" onClick={closeModal}>
        Cancel
      </button>
    </div>
  }
>
  <p>
    Are you sure you want to delete this item? This action cannot be undone.
  </p>
</Modal>
```

## Using with ModalContext

For more complex scenarios, you can use the `ModalContext` to manage multiple modals:

```jsx
import React from 'react';
import { useModal } from '../../contexts/ModalContext';

const MyComponent = () => {
  const { openModal, closeModal } = useModal();

  const handleOpenModal = () => {
    openModal({
      component: MyModalContent,
      props: {
        onSave: handleSave,
      },
      modalProps: {
        title: 'My Modal',
        size: 'medium',
        type: 'form',
      },
    });
  };

  return <button onClick={handleOpenModal}>Open Modal</button>;
};

// Define modal content as a separate component
const MyModalContent = ({ onSave, onClose }) => {
  return (
    <div>
      <p>Modal content goes here</p>
      <button onClick={onSave}>Save</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};

export default MyComponent;
```

## DraggableModal

For modals that need to be draggable, use the `DraggableModal` component which extends the base Modal:

```jsx
import React from 'react';
import DraggableModal from '../components/common/DraggableModal';

const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Draggable Modal</button>

      <DraggableModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Draggable Modal"
      >
        <p>This modal can be dragged by its header.</p>
      </DraggableModal>
    </>
  );
};
```

## Best Practices

1. **Use the standard Modal component** for all new modals in the application
2. **Keep modal content focused** on a single task or piece of information
3. **Use appropriate sizing** based on the content (don't use large modals for simple messages)
4. **Include clear action buttons** with descriptive labels
5. **Handle keyboard accessibility** (the Modal component does this automatically)
6. **Prefer the ModalContext** for complex applications with multiple modals
