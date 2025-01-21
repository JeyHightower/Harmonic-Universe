import React, { useCallback, useEffect, useRef } from 'react';
import { useAnimationFrame } from '../../hooks/useAnimationFrame';
import { useResizeEvent } from '../../hooks/useEventListener';
import { useInterval } from '../../hooks/useTimer';
import styles from './PhysicsSimulation.module.css';

const PhysicsSimulation = ({
  particles,
  forceFields,
  onParticleUpdate,
  onCollision,
  width = 800,
  height = 600,
  settings = {},
}) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const particleStatesRef = useRef(new Map());

  const {
    gravity = 9.81,
    friction = 0.1,
    elasticity = 0.8,
    timeStep = 1 / 60,
    maxVelocity = 1000,
    updateInterval = 16, // ~60fps
  } = settings;

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.scale(dpr, dpr);

    contextRef.current = context;
  }, [width, height]);

  useEffect(() => {
    setupCanvas();
  }, [setupCanvas]);

  useResizeEvent(setupCanvas);

  const updateParticleState = useCallback(
    (particle, deltaTime) => {
      const state = particleStatesRef.current.get(particle.id) || {
        position: { ...particle.position },
        velocity: { ...particle.velocity },
      };

      // Apply gravity
      state.velocity.y += gravity * deltaTime;

      // Apply force fields
      forceFields.forEach(field => {
        const dx = field.position.x - state.position.x;
        const dy = field.position.y - state.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < field.radius) {
          const force = field.strength / (distance + 1);
          const angle = Math.atan2(dy, dx);
          state.velocity.x += Math.cos(angle) * force * deltaTime;
          state.velocity.y += Math.sin(angle) * force * deltaTime;
        }
      });

      // Apply friction
      state.velocity.x *= 1 - friction * deltaTime;
      state.velocity.y *= 1 - friction * deltaTime;

      // Limit velocity
      const speed = Math.sqrt(
        state.velocity.x * state.velocity.x +
          state.velocity.y * state.velocity.y
      );
      if (speed > maxVelocity) {
        const scale = maxVelocity / speed;
        state.velocity.x *= scale;
        state.velocity.y *= scale;
      }

      // Update position
      state.position.x += state.velocity.x * deltaTime;
      state.position.y += state.velocity.y * deltaTime;

      // Handle collisions with boundaries
      if (state.position.x < 0) {
        state.position.x = 0;
        state.velocity.x = -state.velocity.x * elasticity;
        onCollision?.('left', particle);
      } else if (state.position.x > width) {
        state.position.x = width;
        state.velocity.x = -state.velocity.x * elasticity;
        onCollision?.('right', particle);
      }

      if (state.position.y < 0) {
        state.position.y = 0;
        state.velocity.y = -state.velocity.y * elasticity;
        onCollision?.('top', particle);
      } else if (state.position.y > height) {
        state.position.y = height;
        state.velocity.y = -state.velocity.y * elasticity;
        onCollision?.('bottom', particle);
      }

      particleStatesRef.current.set(particle.id, state);
      return state;
    },
    [
      gravity,
      friction,
      elasticity,
      maxVelocity,
      width,
      height,
      forceFields,
      onCollision,
    ]
  );

  // Physics update loop
  useInterval(() => {
    particles.forEach(particle => {
      const newState = updateParticleState(particle, timeStep);
      onParticleUpdate?.(particle.id, newState);
    });
  }, updateInterval);

  // Render loop
  const render = useCallback(() => {
    if (!contextRef.current) return;

    const context = contextRef.current;
    context.clearRect(0, 0, width, height);

    // Draw force fields
    forceFields.forEach(field => {
      context.beginPath();
      context.arc(
        field.position.x,
        field.position.y,
        field.radius,
        0,
        Math.PI * 2
      );
      context.fillStyle = `rgba(0, 128, 255, ${
        Math.abs(field.strength) * 0.1
      })`;
      context.fill();
    });

    // Draw particles
    particles.forEach(particle => {
      const state = particleStatesRef.current.get(particle.id);
      if (!state) return;

      context.beginPath();
      context.arc(
        state.position.x,
        state.position.y,
        particle.radius || 5,
        0,
        Math.PI * 2
      );
      context.fillStyle = particle.color || '#FF4444';
      context.fill();
    });
  }, [particles, forceFields, width, height]);

  useAnimationFrame(render, [render]);

  return (
    <div className={styles.simulationContainer}>
      <canvas
        ref={canvasRef}
        className={styles.simulationCanvas}
        width={width}
        height={height}
      />
    </div>
  );
};

export default PhysicsSimulation;
