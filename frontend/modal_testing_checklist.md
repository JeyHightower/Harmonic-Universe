# Modal Testing Checklist

## PhysicsParametersModal Testing

### Basic Functionality

- [ ] Modal opens when clicking the "Open Modal" button
- [ ] Modal displays the correct title "Physics Parameters"
- [ ] Modal closes when clicking the close button (X)
- [ ] Modal closes when clicking outside of it (overlay click)
- [ ] Modal closes when pressing the ESC key
- [ ] Modal content is properly centered
- [ ] Modal has appropriate padding and spacing

### Form Elements

- [ ] All form fields are displayed correctly
- [ ] Form fields are properly labeled
- [ ] Input fields accept input as expected
- [ ] Number fields have correct min/max validation
- [ ] Required fields are marked appropriately
- [ ] Form validation works (try submitting with empty required fields)

### Responsiveness

- [ ] Modal displays correctly on large screens (desktop)
- [ ] Modal displays correctly on medium screens (tablet)
- [ ] Modal displays correctly on small screens (mobile)
- [ ] Content scrolls properly when it exceeds the modal height

### Animation & Transitions

- [ ] Modal opens with a smooth animation
- [ ] Modal closes with a smooth animation
- [ ] No visual glitches during open/close transitions

### Accessibility

- [ ] Modal traps focus within itself when open
- [ ] Tab navigation works correctly within the modal
- [ ] Focus returns to the trigger element when closed
- [ ] Screen readers can access modal content

## Testing Tips

1. To test the standard modal at `/test/modal`:

   - Navigate to http://localhost:5173/test/modal
   - Click the "Open Modal" button
   - The PhysicsParametersModal should open within the Modal component

2. To test modal examples at `/examples/modals`:

   - Navigate to http://localhost:5173/examples/modals
   - Click on the different modal buttons (Alert, Confirmation, etc.)
   - Each should trigger a different type of modal

3. Testing issues checklist:
   - If modals don't open, check the browser console for errors
   - If styling is incorrect, check that theme variables are applied
   - If animations don't work, check that transition classes are applied

## Known Issues and Fixes

- If the "Modal Examples" page doesn't work, make sure you're running the latest version with all fixes applied
- If you encounter JS errors related to modalHelpers.js, ensure the file exists and has the correct exports
