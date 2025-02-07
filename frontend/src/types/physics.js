export interface PhysicsObject {
  id: number;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  mass: number;
  material: {
    friction: number;
    restitution: number;
    density: number;
  };
  shape: 'box' | 'sphere' | 'cylinder' | 'plane';
  dimensions: [number, number, number];
  isStatic: boolean;
  isTrigger?: boolean;
  projectId: number;
  createdAt: string;
  updatedAt: string;
}

export interface PhysicsParameters {
  gravity: [number, number, number];
  timeStep: number;
  iterations: number;
  damping: number;
  stiffness: number;
  maxVelocity: number;
}

export interface PhysicsConstraint {
  id: number;
  type: 'distance' | 'hinge' | 'point' | 'slider';
  objectA: number;
  objectB: number;
  parameters: {
    pivotA?: [number, number, number];
    pivotB?: [number, number, number];
    axisA?: [number, number, number];
    axisB?: [number, number, number];
    maxForce?: number;
    collideConnected?: boolean;
  };
  enabled: boolean;
  projectId: number;
  createdAt: string;
  updatedAt: string;
}

export interface PhysicsObjectFormData {
  name: string;
  shape: PhysicsObject['shape'];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  mass?: number;
  isStatic?: boolean;
  isTrigger?: boolean;
  material?: {
    friction: number;
    restitution: number;
    density: number;
  };
}

export 
