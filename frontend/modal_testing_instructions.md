# Modal Testing Instructions

## Overview

We've updated the modal system to use a unified approach with two main testing routes:

1. `/test/modal` - Tests the PhysicsParametersModal using the direct Modal component
2. `/examples/modals` - Tests various modal types using the context-based modal system

## Testing the PhysicsParametersModal

1. Start the development server:

   ```
   cd frontend
   npm run dev
   ```

2. Navigate to: http://localhost:5173/test/modal

3. Click the "Open Modal" button to open the modal

4. Use the checklist in `modal_testing_checklist.md` to verify all functionality

## Testing Modal Examples

1. Start the development server (if not already running)

2. Navigate to: http://localhost:5173/examples/modals

3. Try each of the modal examples:
   - Alert Modal
   - Confirmation Modal
   - Form Modal
   - Custom Modal
   - Draggable Modal

## Important Notes

1. If modals don't appear when clicking buttons:

   - Check browser console for errors
   - Make sure you're using the latest code with all fixes applied
   - Try clearing browser cache or using incognito mode

2. The modal testing should verify:

   - Modal rendering (visuals, positioning, responsiveness)
   - Open/close functionality
   - Form interaction (if applicable)
   - Accessibility features
   - Animation and transitions

3. After successful testing, you can proceed with:
   - Running the backup script: `scripts/backup_basemodal.sh`
   - Removing BaseModal: `scripts/remove_basemodal.sh`

## Troubleshooting

If you encounter issues with the test/modal route:

- Make sure you're using the Button labeled "Open Modal" on the test page
- The modal should open directly within the page

If you encounter issues with the examples/modals route:

- Check that the modal context system is properly initialized
- Verify the modalHelpers.js file exists and has the right exports

For any other issues, consult the development team or check the modal system documentation.
