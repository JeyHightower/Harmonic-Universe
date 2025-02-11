import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addParticle,
  removeParticle,
  updateParticleState,
} from '../../redux/slices/physicsSlice';
import './ParticleSystem.css';

const ParticleSystem = ({ universeId }) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const dispatch = useDispatch();
  const { particles, parameters } = useSelector(state => state.physics);
  const [isPlaying, setIsPlaying] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let lastTime = performance.now();

    const animate = currentTime => {
      if (!isPlaying) return;

      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      const updatedParticles = particles.map(particle => {
        // Apply physics
        const updatedParticle = applyPhysics(particle, deltaTime);

        // Draw particle
        ctx.beginPath();
        ctx.arc(
          updatedParticle.x,
          updatedParticle.y,
          parameters.particleSize,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = updatedParticle.color || '#ff6b4a';
        ctx.fill();

        return updatedParticle;
      });

      // Update particle state in Redux
      dispatch(
        updateParticleState({ universeId, particles: updatedParticles })
      );

      // Remove particles that are out of bounds or expired
      const currentTime = performance.now();
      const activeParticles = updatedParticles.filter(particle => {
        const isExpired =
          currentTime - particle.createdAt > parameters.particleLifetime;
        const isOutOfBounds =
          particle.y > canvas.height ||
          particle.x < 0 ||
          particle.x > canvas.width;
        if (isExpired || isOutOfBounds) {
          dispatch(removeParticle(particle.id));
          return false;
        }
        return true;
      });

      if (activeParticles.length !== updatedParticles.length) {
        dispatch(
          updateParticleState({ universeId, particles: activeParticles })
        );
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, particles, parameters, dispatch, universeId]);

  const applyPhysics = (particle, deltaTime) => {
    const { gravity, airResistance, friction } = parameters;

    // Apply gravity
    particle.vy += gravity * deltaTime;

    // Apply air resistance
    particle.vx *= 1 - airResistance * deltaTime;
    particle.vy *= 1 - airResistance * deltaTime;

    // Update position
    particle.x += particle.vx * deltaTime * parameters.timeScale;
    particle.y += particle.vy * deltaTime * parameters.timeScale;

    // Handle collisions with canvas boundaries
    const canvas = canvasRef.current;
    if (particle.y + parameters.particleSize > canvas.height) {
      particle.y = canvas.height - parameters.particleSize;
      particle.vy = -particle.vy * parameters.elasticity;
      particle.vx *= 1 - friction;
    }

    if (
      particle.x - parameters.particleSize < 0 ||
      particle.x + parameters.particleSize > canvas.width
    ) {
      particle.vx = -particle.vx * parameters.elasticity;
    }

    return particle;
  };

  const handleCanvasClick = e => {
    if (particles.length >= parameters.maxParticles) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newParticle = {
      id: Date.now(),
      x,
      y,
      vx: (Math.random() - 0.5) * 200,
      vy: -Math.random() * 200,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      createdAt: performance.now(),
    };

    dispatch(addParticle(newParticle));
  };

  const handleMouseMove = e => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="particle-system">
      <div className="controls">
        <button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <span className="particle-count">
          Particles: {particles.length} / {parameters.maxParticles}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        className="particle-canvas"
      />
      <div className="instructions">Click anywhere to add particles</div>
    </div>
  );
};

export default ParticleSystem;
