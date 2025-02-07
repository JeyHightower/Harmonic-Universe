import { PhysicsObject, PhysicsParameters } from '@/types/physics';
import * as CANNON from 'cannon-es';

class PhysicsService {
  private world: CANNON.World | null = null;
  private bodies: { [key: number]: CANNON.Body } = {};
  private isRunning = false;
  private timeStep = 1 / 60;
  private lastTime = 0;

  initialize(params: PhysicsParameters) {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(...params.gravity),
    });

    this.world.solver.iterations = params.iterations;
    this.world.defaultContactMaterial.friction = 0.3;
    this.world.defaultContactMaterial.restitution = 0.3;
    this.timeStep = params.timeStep;
  }

  private createBody(object: PhysicsObject): CANNON.Body {
    const shape = this.createShape(object);
    const body = new CANNON.Body({
      mass: object.isStatic ? 0 : object.mass,
      position: new CANNON.Vec3(...object.position),
      quaternion: new CANNON.Quaternion().setFromEuler(...object.rotation),
      material: new CANNON.Material({
        friction: object.material.friction,
        restitution: object.material.restitution,
      }),
    });

    body.addShape(shape);
    return body;
  }

  private createShape(object: PhysicsObject): CANNON.Shape {
    switch (object.shape) {
      case 'box':
        return new CANNON.Box(new CANNON.Vec3(...object.dimensions.map(d => d / 2)));
      case 'sphere':
        return new CANNON.Sphere(object.dimensions[0] / 2);
      case 'cylinder':
        return new CANNON.Cylinder(
          object.dimensions[0] / 2,
          object.dimensions[0] / 2,
          object.dimensions[1],
          16
        );
      case 'plane':
        return new CANNON.Plane();
      default:
        throw new Error(`Unsupported shape: ${object.shape}`);
    }
  }

  addObject(object: PhysicsObject) {
    if (!this.world) return;

    const body = this.createBody(object);
    this.world.addBody(body);
    this.bodies[object.id] = body;
  }

  removeObject(objectId: number) {
    if (!this.world) return;

    const body = this.bodies[objectId];
    if (body) {
      this.world.removeBody(body);
      delete this.bodies[objectId];
    }
  }

  updateObject(objectId: number, updates: Partial<PhysicsObject>) {
    const body = this.bodies[objectId];
    if (!body) return;

    if (updates.position) {
      body.position.set(...updates.position);
    }
    if (updates.rotation) {
      body.quaternion.setFromEuler(...updates.rotation);
    }
    if (updates.mass !== undefined) {
      body.mass = updates.mass;
      body.updateMassProperties();
    }
    if (updates.material) {
      body.material = new CANNON.Material({
        friction: updates.material.friction,
        restitution: updates.material.restitution,
      });
    }
  }

  getObjectTransform(objectId: number) {
    const body = this.bodies[objectId];
    if (!body) return null;

    return {
      position: [body.position.x, body.position.y, body.position.z],
      rotation: [body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w],
    };
  }

  getObjectPositions(): { [key: number]: [number, number, number] } {
    const positions: { [key: number]: [number, number, number] } = {};
    for (const [id, body] of Object.entries(this.bodies)) {
      positions[Number(id)] = [body.position.x, body.position.y, body.position.z];
    }
    return positions;
  }

  step() {
    if (!this.world || !this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.world.step(this.timeStep, deltaTime / 1000, 3);
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
  }

  pause() {
    this.isRunning = false;
  }

  reset() {
    if (!this.world) return;

    for (const body of Object.values(this.bodies)) {
      body.position.setZero();
      body.velocity.setZero();
      body.angularVelocity.setZero();
      body.quaternion.set(0, 0, 0, 1);
    }
  }

  dispose() {
    if (this.world) {
      for (const body of Object.values(this.bodies)) {
        this.world.removeBody(body);
      }
      this.bodies = {};
      this.world = null;
    }
    this.isRunning = false;
  }
}

export const physicsService = new PhysicsService();
export default physicsService;
