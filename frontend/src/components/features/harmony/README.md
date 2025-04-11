# Harmony Feature

This directory contains all harmony-related components that are used to manipulate and display musical harmony parameters in the application. The feature follows the standardized directory structure with separate directories for components, modals, and styles.

## Directory Structure
```
harmony/
├── README.md
├── index.js               # Exports all harmony components
├── components/
│   └── HarmonyPanel.jsx   # Main panel component
├── modals/
│   └── HarmonyParametersModal.jsx  # Modal for editing parameters
└── styles/
    ├── Universe.css                # Shared styles (used by HarmonyPanel)
    └── HarmonyParametersModal.css  # Specific styles for the modal
```

## Components

### HarmonyPanel (`components/HarmonyPanel.jsx`)

**Purpose**: Provides a user interface for displaying and editing harmony parameters within the universe.

**Features**:
- Resonance, dissonance, harmony scale, and balance controls
- Tempo, key, and scale selection
- Instrument selection (primary and secondary)
- Real-time parameter validation with warnings for extreme values
- Save functionality that dispatches to Redux store

**Usage**:
```jsx
import { HarmonyPanel } from '../components/features/harmony';

// Inside your component
return (
  <HarmonyPanel 
    universeId={universeId}
    initialHarmonyParams={harmonyParams}
    readOnly={false}
    onHarmonyParamsChange={handleParamsChange}
  />
);
```

## Modals

### HarmonyParametersModal (`modals/HarmonyParametersModal.jsx`)

**Purpose**: Modal dialog for creating or updating harmony parameters for a scene.

**Features**:
- Form-based input for harmony settings
- Musical properties (key, scale, tempo)
- Emotional properties (mood, complexity)
- Save/update functionality with API integration
- Form validation

**Usage**:
```jsx
import { HarmonyParametersModal } from '../components/features/harmony';

// Inside your component
return (
  <HarmonyParametersModal 
    universeId={universeId}
    sceneId={sceneId}
    initialData={existingParams}
    onClose={handleModalClose}
  />
);
```

## Import Pattern

Components are exported through the index.js file and can be imported individually:

```jsx
import { HarmonyPanel, HarmonyParametersModal } from '../components/features/harmony';
```

## Styles

The feature includes CSS files in the styles directory:
- `HarmonyParametersModal.css`: Styles specific to the harmony parameters modal
- `Universe.css`: Shared styles used by the harmony panel

## Notes

- The HarmonyPanel component is currently marked as deprecated and is not actively used in the application. It's kept for reference or potential future use.
- The HarmonyParametersModal is an Ant Design based form component that requires antd styling to be loaded in the application. 