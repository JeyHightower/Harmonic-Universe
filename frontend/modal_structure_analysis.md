# Modal Components Analysis

## Current Structure

The frontend codebase currently has multiple modal implementations that serve similar purposes but are implemented differently:

### Core Modal Components:

1. **Modal.jsx** - A custom modal implementation (228 lines)

   - Used by most feature components
   - Used by DraggableModal and GlobalModal
   - Handles its own state, animations, and accessibility

2. **BaseModal.jsx** - A wrapper around Ant Design's Modal component (78 lines)
   - Used by PhysicsParametersModal
   - Leverages Ant Design for core functionality
   - Simpler implementation

### Extended Modal Components:

3. **DraggableModal.jsx** - Extends Modal.jsx with dragging functionality
4. **GlobalModal.jsx** - Manages multiple modals using the ModalContext

### State Management:

5. **ModalContext.jsx** - Provides context for modal management throughout the application

## Usage Analysis

- The custom **Modal.jsx** is used extensively throughout the application in various feature components
- **BaseModal.jsx** appears to be used only in PhysicsParametersModal
- There seems to be inconsistent usage of modal components across the application

## Recommendations

1. **Standardize on one modal implementation**:

   - Since Modal.jsx is used more extensively, consider standardizing on this implementation
   - OR standardize on BaseModal.jsx if Ant Design is the preferred UI library for the project

2. **Refactor for consistency**:

   - If keeping both implementations, clearly document when to use each
   - Consider renaming BaseModal.jsx to AntModal.jsx to clarify its purpose
   - Update PhysicsParametersModal to use the standard modal implementation

3. **Documentation**:

   - Add clear documentation about the modal system
   - Document the relationship between components
   - Provide usage examples

4. **Testing**:
   - Add comprehensive tests for modal functionality
   - Ensure all modal variants work correctly

## Implementation Plan

1. Decide on the preferred modal implementation
2. Update components to use the standardized implementation
3. Add documentation
4. Add tests
5. Remove any unused modal components

This refactoring will improve code maintainability and reduce confusion for developers working on the project.
