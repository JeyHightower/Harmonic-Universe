import { MaterialParameters } from './MaterialParametersEditor';

export interface MaterialPreset extends MaterialParameters {
  id: string;
  category: string;
  description: string;
}

export const MATERIAL_PRESETS: MaterialPreset[] = [
  {
    id: 'metal-chrome',
    name: 'Chrome Metal',
    category: 'metals',
    description: 'Polished chrome metal with high reflectivity',
    type: 'physical',
    color: '#ffffff',
    emissive: '#000000',
    emissiveIntensity: 0,
    roughness: 0.1,
    metalness: 0.9,
    opacity: 1,
    transparent: false,
    wireframe: false,
    side: 'front',
    flatShading: false,
    envMapIntensity: 1,
    refractionRatio: 0.98,
  },
  {
    id: 'metal-gold',
    name: 'Gold Metal',
    category: 'metals',
    description: 'Polished gold metal with warm reflections',
    type: 'physical',
    color: '#ffd700',
    emissive: '#000000',
    emissiveIntensity: 0,
    roughness: 0.15,
    metalness: 1,
    opacity: 1,
    transparent: false,
    wireframe: false,
    side: 'front',
    flatShading: false,
    envMapIntensity: 1,
    refractionRatio: 0.98,
  },
  {
    id: 'glass-clear',
    name: 'Clear Glass',
    category: 'glass',
    description: 'Clear glass with high transparency',
    type: 'physical',
    color: '#ffffff',
    emissive: '#000000',
    emissiveIntensity: 0,
    roughness: 0,
    metalness: 0,
    opacity: 0.3,
    transparent: true,
    wireframe: false,
    side: 'double',
    flatShading: false,
    envMapIntensity: 1,
    refractionRatio: 0.98,
  },
  {
    id: 'glass-tinted',
    name: 'Tinted Glass',
    category: 'glass',
    description: 'Tinted glass with blue color',
    type: 'physical',
    color: '#4444ff',
    emissive: '#000000',
    emissiveIntensity: 0,
    roughness: 0.1,
    metalness: 0,
    opacity: 0.5,
    transparent: true,
    wireframe: false,
    side: 'double',
    flatShading: false,
    envMapIntensity: 1,
    refractionRatio: 0.98,
  },
  {
    id: 'plastic-smooth',
    name: 'Smooth Plastic',
    category: 'plastics',
    description: 'Smooth plastic material',
    type: 'standard',
    color: '#ffffff',
    emissive: '#000000',
    emissiveIntensity: 0,
    roughness: 0.3,
    metalness: 0,
    opacity: 1,
    transparent: false,
    wireframe: false,
    side: 'front',
    flatShading: false,
    envMapIntensity: 0.5,
    refractionRatio: 0.95,
  },
  {
    id: 'plastic-rough',
    name: 'Rough Plastic',
    category: 'plastics',
    description: 'Rough plastic material',
    type: 'standard',
    color: '#ffffff',
    emissive: '#000000',
    emissiveIntensity: 0,
    roughness: 0.8,
    metalness: 0,
    opacity: 1,
    transparent: false,
    wireframe: false,
    side: 'front',
    flatShading: false,
    envMapIntensity: 0.3,
    refractionRatio: 0.95,
  },
  {
    id: 'toon-basic',
    name: 'Basic Toon',
    category: 'toon',
    description: 'Basic toon shader material',
    type: 'toon',
    color: '#ffffff',
    emissive: '#000000',
    emissiveIntensity: 0,
    roughness: 0.5,
    metalness: 0,
    opacity: 1,
    transparent: false,
    wireframe: false,
    side: 'front',
    flatShading: true,
    envMapIntensity: 0,
    refractionRatio: 1,
  },
  {
    id: 'emissive-neon',
    name: 'Neon Emissive',
    category: 'emissive',
    description: 'Bright neon emissive material',
    type: 'standard',
    color: '#000000',
    emissive: '#00ff00',
    emissiveIntensity: 2,
    roughness: 0.5,
    metalness: 0,
    opacity: 1,
    transparent: false,
    wireframe: false,
    side: 'front',
    flatShading: false,
    envMapIntensity: 0,
    refractionRatio: 1,
  },
];

export function getMaterialPreset(id: string): MaterialPreset | undefined {
  return MATERIAL_PRESETS.find(preset => preset.id === id);
}

export function getMaterialPresetsByCategory(category: string): MaterialPreset[] {
  return MATERIAL_PRESETS.filter(preset => preset.category === category);
}

export function getAllMaterialCategories(): string[] {
  return Array.from(new Set(MATERIAL_PRESETS.map(preset => preset.category)));
}

export function createCustomPreset(
  parameters: MaterialParameters,
  category: string,
  description: string
): MaterialPreset {
  return {
    ...parameters,
    id: `custom-${Date.now()}`,
    category,
    description,
  };
}
