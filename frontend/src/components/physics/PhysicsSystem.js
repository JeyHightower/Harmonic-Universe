import * as CANNON from 'cannon-es';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

class ParticleSystem {
  constructor(count, world, scene) {
    this.count = count;
    this.world = world;
    this.scene = scene;
    this.particles = [];
    this.bodies = [];
    this.forces = [];

    this.initialize();
  }

  initialize() {
    // Create particle geometry
    const geometry = new THREE.SphereGeometry(1, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
    });

    // Create physics shape
    const shape = new CANNON.Sphere(1);

    for (let i = 0; i < this.count; i++) {
      // Create visual particle
      const mesh = new THREE.Mesh(geometry, material.clone());
      this.scene.add(mesh);
      this.particles.push(mesh);

      // Create physics body
      const body = new CANNON.Body({
        mass: 1,
        shape,
        position: new CANNON.Vec3(
          Math.random() * 100 - 50,
          Math.random() * 100 - 50,
          Math.random() * 100 - 50
        ),
        velocity: new CANNON.Vec3(
          Math.random() * 2 - 1,
          Math.random() * 2 - 1,
          Math.random() * 2 - 1
        ),
      });
      this.world.addBody(body);
      this.bodies.push(body);
    }
  }

  update(audioData) {
    const frequencies = audioData.frequencies;
    const waveform = audioData.waveform;

    // Update particles based on audio data and physics parameters
    for (let i = 0; i < this.count; i++) {
      const particle = this.particles[i];
      const body = this.bodies[i];

      // Map frequency data to particle properties
      const freqIndex = Math.floor((i / this.count) * frequencies.length);
      const frequency = frequencies[freqIndex];
      const scale = 1 + (frequency / 255) * 2;

      // Update visual properties
      particle.scale.set(scale, scale, scale);
      particle.material.emissiveIntensity = frequency / 255;

      // Apply forces based on audio and physics parameters
      const force = new CANNON.Vec3(
        (Math.random() - 0.5) * frequency * 0.1,
        (Math.random() - 0.5) * frequency * 0.1,
        (Math.random() - 0.5) * frequency * 0.1
      );
      body.applyForce(force);

      // Update particle position from physics body
      particle.position.copy(body.position);
      particle.quaternion.copy(body.quaternion);
    }

    // Update force fields
    this.updateForceFields(audioData);
  }

  updateForceFields(audioData) {
    const bassIntensity = audioData.frequencies.slice(0, 4).reduce((a, b) => a + b, 0) / 1024;

    // Apply global force field
    const center = new CANNON.Vec3(0, 0, 0);

    this.bodies.forEach(body => {
      const direction = center.vsub(body.position);
      const distance = direction.length();
      const strength = (bassIntensity * 100) / (distance * distance);

      direction.normalize();
      direction.scale(strength);
      body.applyForce(direction);
    });
  }

  addForceField(position, radius, strength) {
    this.forces.push({
      position: new CANNON.Vec3().copy(position),
      radius,
      strength,
    });
  }

  dispose() {
    // Remove particles from scene
    this.particles.forEach(particle => {
      this.scene.remove(particle);
      particle.geometry.dispose();
      particle.material.dispose();
    });

    // Remove bodies from world
    this.bodies.forEach(body => {
      this.world.removeBody(body);
    });

    this.particles = [];
    this.bodies = [];
    this.forces = [];
  }
}

export const usePhysicsSystem = (params, audioData) => {
  const worldRef = useRef(null);
  const sceneRef = useRef(null);
  const particleSystemRef = useRef(null);
  const frameRef = useRef(null);

  // Physics world configuration with all parameters
  const worldConfig = useMemo(
    () => ({
      gravity: new CANNON.Vec3(0, -params.gravity.value, 0),
      broadphase: new CANNON.SAPBroadphase(),
      solver: new CANNON.GSSolver(),
    }),
    [params.gravity.value]
  );

  useEffect(() => {
    if (!params.is_active) return;

    // Initialize physics world
    const world = new CANNON.World(worldConfig);
    worldRef.current = world;

    // Configure solver with all parameters
    world.solver.iterations = params.substeps.value;
    world.defaultContactMaterial.friction = params.friction.value;
    world.defaultContactMaterial.restitution = params.collision_elasticity.value;

    // Create Three.js scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create particle system
    const particleSystem = new ParticleSystem(1000, world, scene);
    particleSystemRef.current = particleSystem;

    // Add boundaries
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
      mass: 0,
      shape: groundShape,
    });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);

    // Animation loop with advanced physics
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      // Update physics with time step
      world.step(params.time_step.value);

      // Apply forces based on all enabled parameters
      world.bodies.forEach(body => {
        if (body.type !== CANNON.Body.STATIC) {
          // Air resistance force
          if (params.air_resistance.enabled) {
            const velocity = body.velocity;
            const airResistance = params.air_resistance.value;
            const force = new CANNON.Vec3(
              -velocity.x * airResistance,
              -velocity.y * airResistance,
              -velocity.z * airResistance
            );
            body.applyForce(force, body.position);
          }

          // Fluid dynamics forces
          if (params.fluid_density.enabled) {
            const fluidDensity = params.fluid_density.value;
            const viscosity = params.viscosity.enabled ? params.viscosity.value : 0;

            // Calculate drag force
            const velocity = body.velocity;
            const speed = velocity.length();
            const dragCoefficient = 0.47; // Sphere drag coefficient
            const area = Math.PI * Math.pow(1, 2); // Assuming unit radius
            const dragMagnitude = 0.5 * fluidDensity * speed * speed * dragCoefficient * area;

            if (speed > 0) {
              const dragForce = new CANNON.Vec3(
                (-velocity.x / speed) * dragMagnitude,
                (-velocity.y / speed) * dragMagnitude,
                (-velocity.z / speed) * dragMagnitude
              );
              body.applyForce(dragForce, body.position);
            }

            // Apply viscous force
            if (viscosity > 0) {
              const viscousForce = new CANNON.Vec3(
                -velocity.x * viscosity,
                -velocity.y * viscosity,
                -velocity.z * viscosity
              );
              body.applyForce(viscousForce, body.position);
            }
          }

          // Temperature effects (simplified)
          if (params.temperature.enabled) {
            const temperatureEffect = (params.temperature.value - 293.15) / 293.15; // Relative to room temperature
            body.velocity.scale(1 + temperatureEffect * 0.1); // Simplified thermal energy effect
          }

          // Pressure effects (simplified)
          if (params.pressure.enabled) {
            const pressureEffect = (params.pressure.value - 101.325) / 101.325; // Relative to atmospheric pressure
            const pressureForce = new CANNON.Vec3(0, pressureEffect * 9.81, 0); // Simplified buoyancy
            body.applyForce(pressureForce, body.position);
          }
        }
      });

      // Update particle system
      if (audioData) {
        particleSystem.update(audioData);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      particleSystem.dispose();
    };
  }, [worldConfig, params, audioData]);

  // Expose methods to control the physics system
  const api = useMemo(
    () => ({
      addForceField: (position, radius, strength) => {
        particleSystemRef.current?.addForceField(position, radius, strength);
      },
      reset: () => {
        particleSystemRef.current?.dispose();
        const particleSystem = new ParticleSystem(1000, worldRef.current, sceneRef.current);
        particleSystemRef.current = particleSystem;
      },
    }),
    []
  );

  return [sceneRef.current, api];
};

export class CollisionHandler {
  constructor(world) {
    this.world = world;
    this.collisionMatrix = {};
    this.setupCollisionEvents();
  }

  setupCollisionEvents() {
    this.world.addEventListener('beginContact', event => {
      const bodyA = event.bodyA;
      const bodyB = event.bodyB;

      // Generate unique collision ID
      const collisionId = this.getCollisionId(bodyA.id, bodyB.id);

      // Store collision data
      this.collisionMatrix[collisionId] = {
        bodyA,
        bodyB,
        contactPoint: event.contact.getImpactVelocityAlongNormal(),
      };
    });

    this.world.addEventListener('endContact', event => {
      const collisionId = this.getCollisionId(event.bodyA.id, event.bodyB.id);
      delete this.collisionMatrix[collisionId];
    });
  }

  getCollisionId(idA, idB) {
    return idA < idB ? `${idA}-${idB}` : `${idB}-${idA}`;
  }

  handleCollision(bodyA, bodyB, callback) {
    const collisionId = this.getCollisionId(bodyA.id, bodyB.id);
    if (this.collisionMatrix[collisionId]) {
      callback(this.collisionMatrix[collisionId]);
    }
  }

  clearCollisions() {
    this.collisionMatrix = {};
  }
}

export default usePhysicsSystem;
