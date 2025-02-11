export * from './Scene';
export * from './Universe';
export * from './User';

// Export all entities for TypeORM configuration
export const entities = [User, Universe, Scene];
