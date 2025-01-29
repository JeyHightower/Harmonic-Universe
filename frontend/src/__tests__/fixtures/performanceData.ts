import { v4 as uuidv4 } from 'uuid';

export const generateLargeStoryboard = (numScenes: number) => {
  const scenes = Array.from({ length: numScenes }, (_, index) => ({
    id: index + 1,
    title: `Scene ${index + 1}`,
    sequence_number: index + 1,
    content: {
      duration: Math.floor(Math.random() * 30) + 30, // 30-60 seconds
      background: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      elements: Array.from({ length: 10 }, (_, i) => ({
        id: uuidv4(),
        type: 'text',
        content: `Element ${i}`,
        position: {
          x: Math.random() * 1000,
          y: Math.random() * 1000,
        },
        style: {
          fontSize: Math.floor(Math.random() * 24) + 12,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        },
      })),
    },
    visual_effects: Array.from({ length: 5 }, (_, i) => ({
      id: uuidv4(),
      type: ['fade', 'slide', 'zoom', 'rotate'][Math.floor(Math.random() * 4)],
      start_time: i * 5,
      duration: Math.floor(Math.random() * 5) + 2,
      parameters: {
        opacity: Math.random(),
        scale: Math.random() * 2,
        rotation: Math.random() * 360,
      },
    })),
    audio_tracks: Array.from({ length: 3 }, (_, i) => ({
      id: uuidv4(),
      type: ['background', 'voice', 'effect'][i % 3],
      url: `https://example.com/audio${i}.mp3`,
      start_time: i * 10,
      duration: Math.floor(Math.random() * 20) + 10,
      volume: Math.random(),
    })),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  return {
    id: 1,
    title: 'Performance Test Storyboard',
    description: 'A large storyboard for performance testing',
    scenes,
    metadata: {
      totalDuration: scenes.reduce((acc, scene) => acc + scene.content.duration, 0),
      totalEffects: scenes.reduce((acc, scene) => acc + scene.visual_effects.length, 0),
      totalAudioTracks: scenes.reduce((acc, scene) => acc + scene.audio_tracks.length, 0),
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

export const generateManyEffects = (numEffects: number) => {
  return Array.from({ length: numEffects }, (_, index) => ({
    id: uuidv4(),
    type: ['fade', 'slide', 'zoom', 'rotate', 'blur', 'color', 'wave'][
      Math.floor(Math.random() * 7)
    ],
    start_time: Math.floor(Math.random() * 300), // 0-300 seconds
    duration: Math.floor(Math.random() * 10) + 1, // 1-10 seconds
    parameters: {
      opacity: Math.random(),
      scale: Math.random() * 2,
      rotation: Math.random() * 360,
      blur: Math.random() * 20,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      amplitude: Math.random() * 50,
      frequency: Math.random() * 2,
    },
    target: {
      elementId: `element-${Math.floor(Math.random() * 100)}`,
      property: ['opacity', 'transform', 'filter'][Math.floor(Math.random() * 3)],
    },
    easing: ['linear', 'ease-in', 'ease-out', 'ease-in-out'][
      Math.floor(Math.random() * 4)
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
};
