export * from './base.repository';
export * from './scene.repository';
export * from './universe.repository';
export * from './user.repository';

// Create repository instances
import { SceneRepository } from './scene.repository';
import { UniverseRepository } from './universe.repository';
import { UserRepository } from './user.repository';

export const repositories = {
  user: new UserRepository(),
  universe: new UniverseRepository(),
  scene: new SceneRepository(),
} as const;
