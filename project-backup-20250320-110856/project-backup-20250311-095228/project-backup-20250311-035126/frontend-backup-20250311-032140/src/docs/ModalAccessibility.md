# Modal Accessibility Guide

This guide explains the accessibility features implemented in our modal system and provides best practices for creating accessible modals.

## Accessibility Features

Our modal system includes the following accessibility features:

### Keyboard Navigation

- **Focus Trap**: When a modal opens, focus is trapped within the modal to prevent users from tabbing outside of it.
- **Escape Key**: Pressing the `Escape` key closes the modal.
- **Initial Focus**: When a modal opens, focus is placed on the first focusable element or can be customized using the `initialFocusRef` prop.
- **Focus Restoration**: When a modal closes, focus is returned to the element that was focused before the modal opened.

### Screen Reader Support

- **ARIA Attributes**: Modals have appropriate ARIA attributes including:
  - `role="dialog"` to indicate the modal role
  - `aria-modal="true"` to indicate it's a modal dialog
  - `aria-labelledby` pointing to the modal title
  - `aria-describedby` pointing to the modal content (when applicable)
- **Unique IDs**: Each modal generates unique IDs for its title and content elements.

### Visual Styles

- **Focus Indicators**: Visible focus indicators for all interactive elements.
- **High Contrast Support**: Styles that work well in high contrast mode.
- **Reduced Motion**: Respects the user's preference for reduced motion via the `prefers-reduced-motion` media query.

## Using Modal Accessibility Features

### Basic Usage

```jsx
import { useRef } from 'react';
import Modal from '../components/common/Modal';

const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const initialFocusRef = useRef(null);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Accessible Modal"
        initialFocusRef={initialFocusRef}
      >
        <p>This is an accessible modal with proper focus management.</p>
        <button ref={initialFocusRef}>This button gets focus first</button>
        <button onClick={() => setIsOpen(false)}>Close</button>
      </Modal>
    </>
  );
};
```

### Custom Description

```jsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirmation"
  ariaDescribedBy="modal-description"
>
  <p id="modal-description">
    This description will be announced to screen readers.
  </p>
  <button onClick={handleConfirm}>Confirm</button>
  <button onClick={() => setIsOpen(false)}>Cancel</button>
</Modal>
```

## Accessibility Best Practices

1. **Descriptive Titles**: Provide clear, descriptive titles for all modals.
2. **Keyboard Support**: Ensure all functionality in modals is accessible via keyboard.
3. **Visible Focus**: Make sure focus states are clearly visible.
4. **Simple Language**: Use plain language and avoid technical jargon.
5. **Adequate Color Contrast**: Ensure text has sufficient contrast with background colors.
6. **Proper Button Labels**: Use descriptive button text instead of generic labels like "OK".
7. **Error Handling**: Provide clear error messages and instructions for correction.

## Testing Accessibility

1. **Keyboard Navigation**: Test that you can navigate the modal using only the keyboard.
2. **Screen Readers**: Test with screen readers like VoiceOver, NVDA, or JAWS.
3. **High Contrast Mode**: Test in high contrast mode to ensure content remains visible.
4. **Reduced Motion**: Test with reduced motion preferences enabled.

## Resources

- [WAI-ARIA Authoring Practices: Dialog Modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [MDN Web Docs: ARIA: dialog role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/dialog_role)
- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/TR/WCAG21/)
