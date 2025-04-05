# Duplicate Components Analysis

This document identifies components that appear to be duplicated between the `frontend/src/features/` and `frontend/src/components/` directories.

## Confirmed Duplicates

| Features Component           | Components Equivalent               | Notes                             |
| ---------------------------- | ----------------------------------- | --------------------------------- |
| `UserProfileModal.jsx`       | `common/UserProfileModal.jsx`       | 100% duplicate, confirmed earlier |
| `ConfirmDeleteWrapper.jsx`   | `common/ConfirmDeleteWrapper.jsx`   | Same functionality                |
| `VisualizationFormModal.jsx` | `common/VisualizationFormModal.jsx` | Same functionality                |
| `AudioDetailsModal.jsx`      | `music/AudioDetailsModal.jsx`       | Same functionality                |
| `AudioGenerationModal.jsx`   | `music/AudioGenerationModal.jsx`    | Same functionality                |
| `MusicModal.jsx`             | `music/MusicModal.jsx`              | Same functionality                |
| `MusicPlayer.jsx`            | `music/MusicPlayer.jsx`             | Same functionality                |
| `MusicVisualizer3D.jsx`      | `music/MusicVisualizer3D.jsx`       | Same functionality                |

## Physics Components

| Features Component             | Components Equivalent                  | Notes              |
| ------------------------------ | -------------------------------------- | ------------------ |
| `PhysicsConstraintModal.jsx`   | `physics/PhysicsConstraintModal.jsx`   | Same functionality |
| `PhysicsObjectForm.jsx`        | `physics/PhysicsObjectForm.jsx`        | Same functionality |
| `PhysicsObjectFormModal.jsx`   | `physics/PhysicsObjectFormModal.jsx`   | Same functionality |
| `PhysicsObjectsList.jsx`       | `physics/PhysicsObjectsList.jsx`       | Same functionality |
| `PhysicsObjectsManager.jsx`    | `physics/PhysicsObjectsManager.jsx`    | Same functionality |
| `PhysicsPage.jsx`              | `physics/PhysicsPage.jsx`              | Same functionality |
| `PhysicsParametersManager.jsx` | `physics/PhysicsParametersManager.jsx` | Same functionality |
| `PhysicsParametersModal.jsx`   | `physics/PhysicsParametersModal.jsx`   | Same functionality |

## Universe Components

| Features Component        | Components Equivalent              | Notes              |
| ------------------------- | ---------------------------------- | ------------------ |
| `UniverseCard.jsx`        | `universe/UniverseCard.jsx`        | Same functionality |
| `UniverseCreate.jsx`      | `universe/UniverseCreate.jsx`      | Same functionality |
| `UniverseDeleteModal.jsx` | `universe/UniverseDeleteModal.jsx` | Same functionality |
| `UniverseEdit.jsx`        | `universe/UniverseEdit.jsx`        | Same functionality |
| `UniverseFormModal.jsx`   | `universe/UniverseFormModal.jsx`   | Same functionality |
| `UniverseInfoModal.jsx`   | `universe/UniverseInfoModal.jsx`   | Same functionality |
| `UniverseList.jsx`        | `universe/UniverseList.jsx`        | Same functionality |
| `UniverseManager.jsx`     | `universe/UniverseManager.jsx`     | Same functionality |

## Harmony Components

| Features Component           | Components Equivalent                | Notes                                    |
| ---------------------------- | ------------------------------------ | ---------------------------------------- |
| `HarmonyPage.jsx`            | `harmony/HarmonyPage.jsx`            | Likely duplicate, need to verify content |
| `HarmonyParametersModal.jsx` | `harmony/HarmonyParametersModal.jsx` | Same functionality                       |

## Scene Components

| Features Component     | Components Equivalent                | Notes                                      |
| ---------------------- | ------------------------------------ | ------------------------------------------ |
| `SceneCreateModal.jsx` | `consolidated/SceneModalHandler.jsx` | May be handled by the consolidated version |
| `SceneEditModal.jsx`   | `consolidated/SceneModalHandler.jsx` | May be handled by the consolidated version |
| `SceneFormModal.jsx`   | `consolidated/SceneForm.jsx`         | Similar functionality                      |
| `SceneList.jsx`        | `consolidated/ScenesExample.jsx`     | Need to verify content                     |
| `SceneManager.jsx`     | `consolidated/SceneModalHandler.jsx` | May be handled by the consolidated version |

## Page Components

| Features Component | Components Equivalent                                   | Notes                    |
| ------------------ | ------------------------------------------------------- | ------------------------ |
| `Dashboard.jsx`    | No clear equivalent                                     | May need to be preserved |
| `Home.jsx`         | No clear equivalent                                     | May need to be preserved |
| `NotFound.jsx`     | No clear equivalent                                     | May need to be preserved |
| `ProfilePage.jsx`  | No clear equivalent                                     | May need to be preserved |
| `SettingsPage.jsx` | `settings/Settings.jsx` or `settings/SettingsModal.jsx` | Need to verify content   |
| `VisualPage.jsx`   | No clear equivalent                                     | May need to be preserved |

## Consolidation Strategy

For each duplicate component, we should:

1. Compare the code in both versions to determine which is more feature-complete
2. Keep the more comprehensive/well-structured version
3. Update references to use the kept version
4. Remove the redundant version

We should prioritize components in the `components/` directory as the source of truth, except in cases where the `features/` version has more functionality.
