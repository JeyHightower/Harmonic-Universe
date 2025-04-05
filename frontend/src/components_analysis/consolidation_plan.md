# Component Consolidation Plan

## Strategy

1. **Keep Components in `components/` Directory**: Since components in this directory are properly grouped by functionality and are referenced via the `frontend/src/components/index.js` exports, we'll use these as our source of truth.

2. **Update Imports**: For components in `features/` that are duplicates of those in `components/`, we need to update all imports in the codebase to reference the `components/` version instead.

3. **Remove Duplicates**: After updating all imports, remove the duplicate components from the `features/` directory.

## Steps for Each Component

1. **Verify Duplication**: Confirm that the components are functionally identical.
2. **Search for Imports**: Find all imports referencing the duplicate component in `features/`.
3. **Update Imports**: Change imports to reference the component from `components/`.
4. **Remove Duplicate**: Delete the duplicate component from `features/`.
5. **Test Functionality**: Ensure the application still works correctly after the changes.

## Consolidated Component Exports

The `components/index.js` file already provides a well-organized export structure for most components:

- Common components are exported directly
- Music components are exported via `MusicComponents` object
- Physics components are exported via `PhysicsComponents` object
- Debug components are exported via `DebugComponents` object

We should preserve this structure and ensure all imports throughout the application use these exported components.

## Implementation Order

1. **Start with AudioDetailsModal**:

   - ✅ Confirmed 100% duplicate between `features/AudioDetailsModal.jsx` and `components/music/AudioDetailsModal.jsx`
   - ✅ Already properly exported via `MusicComponents.AudioDetailsModal` in `components/index.js`
   - ✅ No imports found referencing the `features/` version
   - ✅ Removed duplicate from features directory

2. **Continue with other Music Components**:

   - ✅ `AudioGenerationModal.jsx` - Removed, no imports found
   - ✅ `MusicModal.jsx` - Removed, only imported in deprecated MusicManager.jsx
   - ✅ `MusicManager.jsx` - Removed, deprecated and not imported anywhere
   - ✅ `MusicPlayer.jsx` - Removed, no imports found
   - ✅ `MusicVisualizer3D.jsx` - Removed, no imports found

3. **Physics Components**:

   - All physics components appear to be duplicated

4. **Universe Components**:

   - All universe components appear to be duplicated

5. **Harmony Components**:

   - `HarmonyPage.jsx`
   - `HarmonyParametersModal.jsx`

6. **Scene Components**:

   - May require more careful analysis as there are consolidated versions
   - Found import for `SceneFormModal` from features in:
     - `frontend/src/components/routing/SceneEditRedirect.jsx`
     - `frontend/src/utils/modalRegistry.js`
     - `frontend/src/features/SceneList.jsx`

7. **Common Components**:

   - `ConfirmDeleteWrapper.jsx`
   - `UserProfileModal.jsx`
   - `VisualizationFormModal.jsx`

8. **Page Components**:
   - Require analysis to determine if they should be preserved in `features/` or moved to a `pages/` directory

## Tracking Progress

We'll track our progress in this document by checking off components as they are consolidated.

- [x] AudioDetailsModal.jsx - Removed, no imports found
- [x] AudioGenerationModal.jsx - Removed, no imports found
- [x] MusicModal.jsx - Removed, only imported in deprecated MusicManager.jsx
- [x] MusicManager.jsx - Removed, deprecated and not imported anywhere
- [x] MusicPlayer.jsx - Removed, no imports found
- [x] MusicVisualizer3D.jsx - Removed, no imports found
- [x] PhysicsConstraintModal.jsx - Removed, not imported anywhere
- [x] PhysicsObjectForm.jsx - Removed, not imported anywhere
- [x] PhysicsObjectFormModal.jsx - Removed, not imported anywhere
- [x] PhysicsObjectsList.jsx - Removed, not imported anywhere
- [x] PhysicsObjectsManager.jsx - Removed, not imported anywhere
- [x] PhysicsPage.jsx - Removed, not imported anywhere
- [x] PhysicsParametersManager.jsx - Removed, not imported anywhere
- [x] PhysicsParametersModal.jsx - Removed, not imported anywhere
- [x] UniverseCard.jsx - Removed, not imported anywhere
- [x] UniverseCreate.jsx - Removed, not imported anywhere
- [x] UniverseDeleteModal.jsx - Updated import in UniverseDetail.jsx to use the version from universe components
- [x] UniverseEdit.jsx - Removed, not imported anywhere
- [x] UniverseFormModal.jsx - Updated import in UniverseDetail.jsx to use the version from universe components
- [x] UniverseInfoModal.jsx - Removed, not imported anywhere
- [x] UniverseList.jsx - Removed, not imported anywhere
- [x] UniverseManager.jsx - Removed, not imported anywhere
- [x] HarmonyPage.jsx - Removed, not imported anywhere
- [x] HarmonyParametersModal.jsx - Removed, not imported anywhere
- [x] ConfirmDeleteWrapper.jsx - Removed, not imported anywhere
- [x] UserProfileModal.jsx - Updated import in ProfilePage.jsx to use the version from common components
- [x] VisualizationFormModal.jsx - Removed, not imported anywhere
- [x] SceneFormModal.jsx - Replaced with SceneModalHandler in SceneEditRedirect.jsx, modalRegistry.js, and SceneList.jsx
- [x] SceneCreateModal.jsx - Removed, not imported anywhere
- [x] SceneEditModal.jsx - Removed, not imported anywhere
- [x] SceneManager.jsx - Removed, not imported anywhere and referenced non-existent paths
