import { useCallback, useEffect, useRef, useState } from 'react';

const usePhysicsSimulation = parameters => {
  const [particles, setParticles] = useState([]);
  const [forceFields, setForceFields] = useState([]);
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(performance.now());

  const applyForceField = useCallback((particle, field) => {
    const dx = field.x - particle.x;
    const dy = field.y - particle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > field.radius) return;

    let force = 0;
    switch (field.falloff) {
      case 'linear':
        force = 1 - distance / field.radius;
        break;
      case 'inverse':
        force = 1 / (distance + 1);
        break;
      case 'inverse-square':
        force = 1 / (distance * distance + 1);
        break;
      default:
        force = 1;
    }

    force *= field.strength;

    switch (field.type) {
      case 'radial':
        particle.vx += (dx / distance) * force;
        particle.vy += (dy / distance) * force;
        break;
      case 'directional':
        particle.vx += Math.cos(field.angle) * force;
        particle.vy += Math.sin(field.angle) * force;
        break;
      case 'vortex':
        particle.vx += (-dy * force) / distance;
        particle.vy += (dx * force) / distance;
        break;
    }
  }, []);

  const updateParticle = useCallback(
    (particle, deltaTime) => {
      const { gravity, airResistance, friction, elasticity, timeScale } =
        parameters;

      // Apply gravity
      particle.vy += gravity * deltaTime;

      // Apply air resistance
      particle.vx *= 1 - airResistance * deltaTime;
      particle.vy *= 1 - airResistance * deltaTime;

      // Apply force fields
      forceFields.forEach(field => {
        applyForceField(particle, field);
      });

      // Update position
      particle.x += particle.vx * deltaTime * timeScale;
      particle.y += particle.vy * deltaTime * timeScale;

      // Handle collisions with boundaries
      if (particle.y > window.innerHeight - parameters.particleSize) {
        particle.y = window.innerHeight - parameters.particleSize;
        particle.vy = -particle.vy * elasticity;
        particle.vx *= 1 - friction;
      }

      if (particle.x < parameters.particleSize) {
        particle.x = parameters.particleSize;
        particle.vx = -particle.vx * elasticity;
      } else if (particle.x > window.innerWidth - parameters.particleSize) {
        particle.x = window.innerWidth - parameters.particleSize;
        particle.vx = -particle.vx * elasticity;
      }

      return particle;
    },
    [parameters, forceFields, applyForceField]
  );

  const addParticle = useCallback(
    (x, y, vx = 0, vy = 0) => {
      if (particles.length >= parameters.maxParticles) return;

      const newParticle = {
        id: Date.now(),
        x,
        y,
        vx: vx || (Math.random() - 0.5) * 200,
        vy: vy || -Math.random() * 200,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        createdAt: performance.now(),
      };

      setParticles(prev => [...prev, newParticle]);
    },
    [particles.length, parameters.maxParticles]
  );

  const removeParticle = useCallback(id => {
    setParticles(prev => prev.filter(p => p.id !== id));
  }, []);

  const addForceField = useCallback(field => {
    setForceFields(prev => [...prev, { ...field, id: Date.now() }]);
  }, []);

  const removeForceField = useCallback(id => {
    setForceFields(prev => prev.filter(f => f.id !== id));
  }, []);

  const updateForceField = useCallback((id, updates) => {
    setForceFields(prev =>
      prev.map(field => (field.id === id ? { ...field, ...updates } : field))
    );
  }, []);

  useEffect(() => {
    const animate = currentTime => {
      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      setParticles(prev => {
        const currentTime = performance.now();
        return prev
          .map(particle => updateParticle(particle, deltaTime))
          .filter(particle => {
            const isExpired =
              currentTime - particle.createdAt > parameters.particleLifetime;
            const isOutOfBounds =
              particle.y > window.innerHeight ||
              particle.x < 0 ||
              particle.x > window.innerWidth;
            return !isExpired && !isOutOfBounds;
          });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [parameters, updateParticle]);

  return {
    particles,
    forceFields,
    addParticle,
    removeParticle,
    addForceField,
    removeForceField,
    updateForceField,
  };
};

export default usePhysicsSimulation;
