/**
 * Consolidated Music Components
 * 
 * This file exports all music-related components to provide a clean interface
 * for importing them throughout the application.
 */

// Player Components
export { default as MusicPlayer } from './MusicPlayerComponent';

// Music Generation Components
export { MusicModalComponent as MusicGenerationModal } from '../consolidated';
export { default as MusicVisualizer3D } from './MusicVisualizer3D';
export { MusicModalComponent as MusicModal } from '../consolidated';
export { AudioDetailsModalFinal as AudioDetailsModal } from '../consolidated';
export { AudioGenerationModalFinal as AudioGenerationModal } from '../consolidated'; 