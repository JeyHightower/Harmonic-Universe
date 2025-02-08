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

    // Update particles based on audio data
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

      // Apply forces based on audio
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

export const usePhysicsSystem = audioData => {
  const worldRef = useRef(null);
  const sceneRef = useRef(null);
  const particleSystemRef = useRef(null);
  const frameRef = useRef(null);

  // Physics world configuration
  const worldConfig = useMemo(
    () => ({
      gravity: new CANNON.Vec3(0, -9.82, 0),
      broadphase: new CANNON.SAPBroadphase(),
      solver: new CANNON.GSSolver(),
    }),
    []
  );

  useEffect(() => {
    // Initialize physics world
    const world = new CANNON.World(worldConfig);
    worldRef.current = world;

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

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      // Update physics
      world.step(1 / 60);

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
  }, [worldConfig]);

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
