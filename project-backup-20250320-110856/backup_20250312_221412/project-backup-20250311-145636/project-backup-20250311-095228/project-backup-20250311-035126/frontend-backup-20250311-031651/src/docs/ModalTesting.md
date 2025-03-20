# Modal Testing Guide

This guide provides instructions for testing the modal system's accessibility features and route integration.

## Test Component Overview

We've created a dedicated test component at `frontend/src/components/test/ModalAccessibilityTest.jsx` which demonstrates and allows testing of the modal system's features.

## Setting Up the Test Route

To use the test component, add it to your route configuration:

```jsx
import ModalAccessibilityTest from './components/test/ModalAccessibilityTest';

// In your route configuration
<Route path="/modal-test" element={<ModalAccessibilityTest />} />;
```

Then navigate to `/modal-test` in your application to access the test interface.

## Manual Testing Steps

### Accessibility Testing

1. **Focus Management**

   - Open the "Accessible Modal" from the test component
   - Verify that focus is automatically moved to the Submit button (configured via `initialFocusRef`)
   - Tab through the modal and verify focus remains trapped within the modal (it should cycle through focusable elements)
   - Close the modal using the ESC key
   - Verify focus returns to the button that opened the modal

2. **Keyboard Navigation**

   - Open the modal using only the keyboard (Tab to the button and press Enter)
   - Navigate through all interactive elements using Tab
   - Activate buttons using Enter or Space
   - Close the modal using ESC key
   - Compare with the "Basic Modal" which lacks some of these enhancements

3. **Screen Reader Testing**

   - Enable a screen reader (VoiceOver on Mac, NVDA on Windows, or TalkBack on Android)
   - Open the modal and verify the screen reader announces:
     - The modal's presence
     - The modal's title
     - The modal's description (from `ariaDescribedBy`)
   - Navigate through the modal content using the screen reader
   - Verify all content is properly announced
   - Close the modal and verify the screen reader indicates it's closed

4. **Visual Testing**
   - Verify that focus indicators are visible for all interactive elements
   - Test in high contrast mode if possible (OS setting)
   - Test with browser zoom at 200% to verify layout still works
   - Verify color contrast meets WCAG standards

### Route Integration Testing

1. **URL Updates**

   - Click "Open Modal with URL Update" button
   - Verify the URL updates to include modal parameters
   - Close the modal and verify the URL returns to its previous state

2. **Browser History**

   - Open the modal with URL update
   - Press the browser back button
   - Verify the modal closes
   - Press the browser forward button
   - Verify the modal reopens

3. **Deep Linking**

   - Copy the deep link URL displayed in the test component
   - Open a new browser tab and paste the URL
   - Verify the application loads with the modal already open
   - Verify the modal contains the correct content based on URL parameters

4. **State Persistence**
   - Open the modal with URL update
   - Navigate to another route within your application
   - Use the browser back button to return
   - Verify the modal reopens with its previous state intact

## Automated Testing

You can create automated tests using testing libraries like Jest and React Testing Library. Here's a sample test structure:

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ModalAccessibilityTest from './ModalAccessibilityTest';

describe('Modal Accessibility', () => {
  it('should trap focus within the modal', () => {
    render(
      <BrowserRouter>
        <ModalAccessibilityTest />
      </BrowserRouter>
    );

    // Open the modal
    fireEvent.click(screen.getByText('Open Accessible Modal'));

    // Verify modal is open
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Tab through all elements and verify focus stays in modal
    // This requires more complex testing of focus state
  });

  it('should close on ESC key press', () => {
    render(
      <BrowserRouter>
        <ModalAccessibilityTest />
      </BrowserRouter>
    );

    // Open the modal
    fireEvent.click(screen.getByText('Open Accessible Modal'));

    // Verify modal is open
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();

    // Press ESC key
    fireEvent.keyDown(modal, { key: 'Escape', code: 'Escape' });

    // Verify modal is closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // Add more test cases for other accessibility features
});
```

## Common Issues and Troubleshooting

1. **Focus Not Trapped**

   - Check that the `Modal` component has the focus trap implementation
   - Verify that the modal container has `tabIndex={-1}` to make it focusable
   - Ensure event listeners for Tab navigation are properly set up

2. **Screen Reader Announcement Issues**

   - Verify appropriate ARIA attributes: `role="dialog"`, `aria-modal="true"`
   - Check that `aria-labelledby` matches the ID of the title element
   - Check that `ariaDescribedBy` matches the ID of the description element

3. **Route Integration Issues**
   - Verify that modal state is properly synchronized with URL parameters
   - Check that the `ModalRegistry` component is properly mounted in `App.jsx`
   - Verify that the modal types are properly registered
   - Check browser console for any errors related to routing

## Performance Considerations

- **Focus Management**: Ensure focus management doesn't cause unnecessary re-renders
- **URL Updates**: Be mindful of excessive URL updates, which can cause browser history bloat
- **Modal Registry**: Keep the modal registry efficient, especially if many modal types are registered

## Next Steps

After confirming that the modal system passes all tests, consider implementing:

1. **Comprehensive unit tests** for all modal components
2. **Integration tests** for specific modal use cases
3. **End-to-end tests** to verify modal behavior in real user flows
4. **Performance testing** to ensure modals render and behave efficiently, especially on mobile devices

Remember that accessibility is an ongoing process, not a one-time implementation. Regularly test with real assistive technologies and consider getting feedback from users who rely on these tools.
