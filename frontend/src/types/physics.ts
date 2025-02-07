export interface PhysicsObject {
  id: number;
  projectId: number;
  name: string;
  type: 'sphere' | 'box' | 'plane' | 'cylinder' | 'cone';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  mass: number;
  isStatic: boolean;
  isTrigger: boolean;
  material: {
    friction: number;
    restitution: number;
  };
  constraints: {
    position?: {
      min: [number, number, number];
      max: [number, number, number];
    };
    rotation?: {
      min: [number, number, number];
      max: [number, number, number];
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface PhysicsObjectFormData {
  name: string;
  type: PhysicsObject['type'];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  mass?: number;
  isStatic?: boolean;
  isTrigger?: boolean;
  material?: {
    friction: number;
    restitution: number;
  };
  constraints?: PhysicsObject['constraints'];
}

export interface PhysicsObjectUpdateData extends Partial<PhysicsObjectFormData> {}
