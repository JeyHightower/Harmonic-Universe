# Harmonic Universe - Enhanced Modal System

## Overview

The Harmonic Universe Modal System provides a powerful and flexible solution for displaying modals throughout the application. This implementation includes:

- A centralized modal management system with global state
- Support for various modal types, sizes, positions, and animations
- Helper functions for common modal patterns
- Stacked modals with proper focus management
- Draggable modals for enhanced user interaction

## Features

### Core Modal System

- **Global Modal Management**: Create and manage modals from anywhere in the application using the `useModal` hook
- **Flexible Configuration**: Customize modals with various props, including size, type, animation, and position
- **Focus Management**: Proper keyboard navigation and focus trapping for accessibility
- **Stacked Modals**: Support for displaying multiple modals simultaneously with correct z-index stacking

### Modal Variants

- **Sizes**: Small, Medium, Large, Full
- **Types**: Default, Alert, Confirm, Form
- **Positions**: Center, Top, Bottom
- **Animations**: Fade, Slide, Zoom, None

### Advanced Features

- **Draggable Modals**: Allow users to move modals around the screen by dragging the header
- **Portal-Based Rendering**: Modals render at the document root for proper stacking and styles
- **Backdrop Click Handling**: Configurable backdrop click behavior
- **Scroll Locking**: Prevent body scrolling when modals are open

### Helper Components

- **AlertModal**: Simple modal for displaying information messages
- **ConfirmModal**: Confirmation dialog with confirm/cancel actions
- **FormModal**: Modal wrapper for form components with submit/cancel actions

## Documentation

Comprehensive documentation is available in the `docs/ModalsGuide.md` file, which includes:

- Detailed API reference
- Usage examples
- Best practices
- Implementation details

## Demo

The Modal Examples page (`/examples/modals`) demonstrates all the features of the modal system, including:

- Different modal types (alert, confirm, form)
- Size variants (small, medium, large, full)
- Animation styles (fade, slide, zoom)
- Position variants (top, center, bottom)
- Stacked modals
- Draggable modals

## Implementation

The modal system consists of the following key components:

- `ModalContext.jsx`: Global context for modal state management
- `GlobalModal.jsx`: Component that renders modals from the global context
- `Modal.jsx`: Base modal component with core functionality
- `DraggableModal.jsx`: Enhanced modal with drag-and-drop capability
- `modalHelpers.jsx`: Helper functions and components for common modal patterns

## Usage

```jsx
import { useModal } from '../contexts/ModalContext';
import { createAlertModal } from '../utils/modalHelpers';

function MyComponent() {
  const { openModal } = useModal();

  const handleClick = () => {
    openModal(
      createAlertModal('This is an alert message', {
        title: 'Information',
        size: 'medium',
        animation: 'fade',
      })
    );
  };

  return <button onClick={handleClick}>Show Alert</button>;
}
```

## License

This project is part of Harmonic Universe and is covered by its license terms.
