import { useEffect, useRef, useState } from 'react';

export function usePhysicsEngine(initialParams = {}) {
  const engineRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const [objects, setObjects] = useState([]);

  const defaultParams = {
    gravity: 9.81,
    elasticity: 0.7,
    friction: 0.1,
    airResistance: 0.01,
    ...initialParams,
  };

  const [params, setParams] = useState(defaultParams);

  useEffect(() => {
    // Initialize physics engine
    engineRef.current = {
      lastTime: 0,
      accumulator: 0,
      step: 1 / 60, // 60 FPS
      objects: [],

      update(currentTime) {
        if (!isRunning) return;

        if (engineRef.current.lastTime) {
          const deltaTime = (currentTime - engineRef.current.lastTime) / 1000;
          engineRef.current.accumulator += deltaTime * timeScale;

          while (engineRef.current.accumulator >= engineRef.current.step) {
            updatePhysics(engineRef.current.step);
            engineRef.current.accumulator -= engineRef.current.step;
          }
        }

        engineRef.current.lastTime = currentTime;
        requestAnimationFrame(engineRef.current.update);
      },
    };

    return () => {
      engineRef.current = null;
    };
  }, [isRunning, timeScale]);

  const updatePhysics = deltaTime => {
    // Update each object's position and velocity
    engineRef.current.objects.forEach(obj => {
      // Apply gravity
      obj.velocity.y += params.gravity * deltaTime;

      // Apply air resistance
      const speed = Math.sqrt(obj.velocity.x ** 2 + obj.velocity.y ** 2);
      const dragForce = speed * params.airResistance;
      if (speed > 0) {
        obj.velocity.x -= (obj.velocity.x / speed) * dragForce * deltaTime;
        obj.velocity.y -= (obj.velocity.y / speed) * dragForce * deltaTime;
      }

      // Update position
      obj.position.x += obj.velocity.x * deltaTime;
      obj.position.y += obj.velocity.y * deltaTime;

      // Handle collisions
      handleCollisions(obj);
    });

    // Update state with new object positions
    setObjects([...engineRef.current.objects]);
  };

  const handleCollisions = obj => {
    // Boundary collisions
    if (obj.position.y < 0) {
      obj.position.y = 0;
      obj.velocity.y = -obj.velocity.y * params.elasticity;
      obj.velocity.x *= 1 - params.friction;
    }
    // Add more collision handling as needed
  };

  const addObject = object => {
    engineRef.current.objects.push({
      ...object,
      velocity: { x: 0, y: 0 },
      mass: object.mass || 1,
    });
    setObjects([...engineRef.current.objects]);
  };

  const removeObject = objectId => {
    engineRef.current.objects = engineRef.current.objects.filter(
      obj => obj.id !== objectId
    );
    setObjects([...engineRef.current.objects]);
  };

  const start = () => {
    if (!isRunning) {
      setIsRunning(true);
      engineRef.current.lastTime = 0;
      engineRef.current.update(performance.now());
    }
  };

  const stop = () => {
    setIsRunning(false);
  };

  const reset = () => {
    stop();
    engineRef.current.objects.forEach(obj => {
      obj.position = { ...obj.initialPosition };
      obj.velocity = { x: 0, y: 0 };
    });
    setObjects([...engineRef.current.objects]);
  };

  const updateParams = newParams => {
    setParams(prev => ({
      ...prev,
      ...newParams,
    }));
  };

  return {
    isRunning,
    timeScale,
    objects,
    params,
    setTimeScale,
    addObject,
    removeObject,
    start,
    stop,
    reset,
    updateParams,
  };
}
