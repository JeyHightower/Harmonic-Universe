# Music Components

This directory contains all music-related components for the Harmonic Universe application.

## Components

### Main Components

1. **MusicPlayer** - A comprehensive player component for playing, visualizing, and generating music
2. **MusicVisualizer3D** - 3D visualization component for music using Three.js

### Modal Components

3. **MusicModal** - The main music modal component for creating, viewing, editing, and deleting music
4. **AudioDetailsModal** - Modal for viewing and playing audio tracks
5. **AudioGenerationModal** - Modal for generating audio based on universe/scene parameters

## Usage

These components can be imported directly from the features/music directory:

```jsx
import { 
  MusicPlayer, 
  MusicVisualizer3D,
  MusicModal, 
  AudioDetailsModal, 
  AudioGenerationModal 
} from '../components/features/music';
```

Or through the main components index:

```jsx
import { MusicComponents } from '../components';

const { MusicPlayer, MusicModal } = MusicComponents;
```

## Component Descriptions

### MusicPlayer

A comprehensive player component for music with these features:
- Playback controls
- Volume control
- Visualization (2D and 3D)
- Music generation options
- Download capability

### MusicVisualizer3D

A 3D visualization for music using Three.js that:
- Responds to audio analyzer data
- Adapts to different music styles
- Provides dynamic, reactive visuals

### MusicModal

A flexible modal component with multiple modes:
- `create` - For creating new music
- `view` - For viewing existing music
- `edit` - For editing existing music
- `delete` - For deleting music
- `generate` - For generating music

### AudioDetailsModal

For viewing and playing audio tracks with:
- Audio player with play/pause controls
- Progress bar for seeking
- Music information display
- Edit and delete functionality

### AudioGenerationModal

For generating audio with:
- Algorithm selection (harmonic synthesis, granular synthesis, physical modeling)
- Parameter controls for each algorithm
- Audio preview playback
- Save functionality 