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

## API Route Modal Testing

### Universe Modals

- [ ] `/api/universes/create` opens the universe creation modal
- [ ] `/api/universes/:id/edit` opens the universe edit modal with correct data
- [ ] `/api/universes/:id/delete` opens the delete confirmation modal

### Scene Modals

- [ ] `/api/scenes/create` opens the scene creation modal
- [ ] `/api/scenes/:id/edit` opens the scene edit modal with correct data
- [ ] `/api/scenes/:id/delete` opens the delete confirmation modal

### Physics Object Modals

- [ ] `/api/physics-objects/create` opens the physics object creation modal
- [ ] `/api/physics-objects/:id/edit` opens the physics object edit modal with correct data
- [ ] `/api/physics-objects/:id/delete` opens the delete confirmation modal

### Physics Parameters Modals

- [ ] `/api/physics-parameters/create` opens the physics parameters creation modal
- [ ] `/api/physics-parameters/:id/edit` opens the physics parameters edit modal with correct data
- [ ] `/api/physics-parameters/:id/delete` opens the delete confirmation modal

### Audio Modals

- [ ] `/api/audio/generate` opens the audio generation modal
- [ ] `/api/audio/:id/details` opens the audio details modal with correct data
- [ ] `/api/audio/:id/delete` opens the delete confirmation modal

### Visualization Modals

- [ ] `/api/visualizations/create` opens the visualization creation modal
- [ ] `/api/visualizations/:id/edit` opens the visualization edit modal with correct data
- [ ] `/api/visualizations/:id/delete` opens the delete confirmation modal

### Physics Constraint Modals

- [ ] `/api/physics-constraints/create` opens the physics constraint creation modal
- [ ] `/api/physics-constraints/:id/edit` opens the physics constraint edit modal with correct data
- [ ] `/api/physics-constraints/:id/delete` opens the delete confirmation modal

## Testing Tips

1. To test the standard modal at `/test/modal`:

   - Navigate to http://localhost:5173/test/modal
   - Click the "Open Modal" button
   - The PhysicsParametersModal should open within the Modal component

2. To test modal examples at `/examples/modals`:

   - Navigate to http://localhost:5173/examples/modals
   - Click on the different modal buttons (Alert, Confirmation, etc.)
   - Each should trigger a different type of modal

3. To test API route modals:

   - Navigate directly to the API route URL (e.g., http://localhost:5173/api/universes/create)
   - The appropriate modal should open automatically
   - After closing the modal, you should be redirected to the previous page

4. Testing issues checklist:
   - If modals don't open, check the browser console for errors
   - If styling is incorrect, check that theme variables are applied
   - If animations don't work, check that transition classes are applied

## Known Issues and Fixes

- If the "Modal Examples" page doesn't work, make sure you're running the latest version with all fixes applied
- If you encounter JS errors related to modalHelpers.js, ensure the file exists and has the correct exports
