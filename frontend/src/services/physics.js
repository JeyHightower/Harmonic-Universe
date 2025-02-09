import * as CANNON from 'cannon-es';

class PhysicsService {
  constructor() {
    this.world = null;
    this.bodies = {};
    this.isRunning = false;
    this.timeStep = 1 / 60;
    this.lastTime = 0;
    this.animationFrameId = null;
    this.postStepCallback = null;
  }

  initialize(params) {
    // Cleanup existing world if it exists
    if (this.world) {
      this.cleanup();
    }

    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -params.gravity.value, 0),
    });

    this.world.solver.iterations = params.substeps.value;
    this.world.defaultContactMaterial.friction = params.friction.value;
    this.world.defaultContactMaterial.restitution = params.collision_elasticity.value;
    this.timeStep = params.time_step.value;

    // Apply air resistance as a global force
    this.postStepCallback = () => {
      this.world.bodies.forEach(body => {
        if (body.type !== CANNON.Body.STATIC) {
          const velocity = body.velocity;
          const airResistance = params.air_resistance.value;
          const force = new CANNON.Vec3(
            -velocity.x * airResistance,
            -velocity.y * airResistance,
            -velocity.z * airResistance
          );
          body.applyForce(force, body.position);
        }
      });
    };

    this.world.addEventListener('postStep', this.postStepCallback);
  }

  cleanup() {
    if (this.world && this.postStepCallback) {
      this.world.removeEventListener('postStep', this.postStepCallback);
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.world = null;
    this.bodies = {};
    this.isRunning = false;
    this.lastTime = 0;
    this.postStepCallback = null;
  }

  createBody(object) {
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

  createShape(object) {
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

  addObject(object) {
    if (!this.world) return;

    const body = this.createBody(object);
    this.world.addBody(body);
    this.bodies[object.id] = body;
  }

  removeObject(objectId) {
    if (!this.world || !this.bodies[objectId]) return;

    const body = this.bodies[objectId];
    this.world.removeBody(body);
    delete this.bodies[objectId];
  }

  updateObject(objectId, updates) {
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

  getObjectTransform(objectId) {
    const body = this.bodies[objectId];
    if (!body) return null;

    return {
      position: [body.position.x, body.position.y, body.position.z],
      rotation: [body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w],
    };
  }

  getObjectPositions() {
    const positions = {};
    for (const [id, body] of Object.entries(this.bodies)) {
      positions[Number(id)] = [body.position.x, body.position.y, body.position.z];
    }
    return positions;
  }

  start() {
    if (!this.world || this.isRunning) return;

    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  animate() {
    if (!this.isRunning) return;

    const time = performance.now();
    const deltaTime = (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.world.step(this.timeStep, deltaTime);

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  getObjectState(objectId) {
    const body = this.bodies[objectId];
    if (!body) return null;

    return {
      position: [body.position.x, body.position.y, body.position.z],
      rotation: [body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w],
      velocity: [body.velocity.x, body.velocity.y, body.velocity.z],
      angularVelocity: [body.angularVelocity.x, body.angularVelocity.y, body.angularVelocity.z],
    };
  }
}

export default PhysicsService;
