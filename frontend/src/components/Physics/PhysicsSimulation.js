import Matter from 'matter-js';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import './PhysicsSimulation.css';

const PhysicsSimulation = ({ parameters, isPlaying }) => {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);

  useEffect(() => {
    // Initialize Matter.js
    const engine = Matter.Engine.create();
    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: sceneRef.current.clientWidth,
        height: sceneRef.current.clientHeight,
        wireframes: false,
        background: '#1a1a1a',
      },
    });

    engineRef.current = engine;
    renderRef.current = render;

    // Create walls
    const walls = [
      Matter.Bodies.rectangle(400, 0, 800, 40, { isStatic: true }), // top
      Matter.Bodies.rectangle(400, 600, 800, 40, { isStatic: true }), // bottom
      Matter.Bodies.rectangle(0, 300, 40, 600, { isStatic: true }), // left
      Matter.Bodies.rectangle(800, 300, 40, 600, { isStatic: true }), // right
    ];

    // Add walls to the world
    Matter.World.add(engine.world, walls);

    // Create some initial bodies
    const bodies = [
      Matter.Bodies.circle(400, 200, 20, {
        render: { fillStyle: '#4CAF50' },
      }),
      Matter.Bodies.rectangle(450, 200, 40, 40, {
        render: { fillStyle: '#2196F3' },
      }),
      Matter.Bodies.polygon(350, 200, 5, 20, {
        render: { fillStyle: '#FFC107' },
      }),
    ];

    Matter.World.add(engine.world, bodies);

    // Start the engine and renderer
    Matter.Runner.run(engine);
    Matter.Render.run(render);

    // Handle window resize
    const handleResize = () => {
      render.canvas.width = sceneRef.current.clientWidth;
      render.canvas.height = sceneRef.current.clientHeight;
      Matter.Render.setPixelRatio(render, window.devicePixelRatio);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      Matter.Render.stop(render);
      Matter.Runner.stop(engine);
      render.canvas.remove();
      render.canvas = null;
      render.context = null;
      render.textures = {};
    };
  }, []);

  // Update physics parameters when they change
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.world.gravity.y = parameters.gravity;
      engineRef.current.world.bodies.forEach(body => {
        if (!body.isStatic) {
          body.friction = parameters.friction;
          body.restitution = parameters.elasticity;
          body.frictionAir = parameters.airResistance;
        }
      });
    }
  }, [parameters]);

  // Handle play/pause
  useEffect(() => {
    if (engineRef.current) {
      if (isPlaying) {
        Matter.Runner.run(engineRef.current);
      } else {
        Matter.Runner.stop(engineRef.current);
      }
    }
  }, [isPlaying]);

  return <div ref={sceneRef} className="physics-simulation"></div>;
};

PhysicsSimulation.propTypes = {
  parameters: PropTypes.shape({
    gravity: PropTypes.number.isRequired,
    friction: PropTypes.number.isRequired,
    elasticity: PropTypes.number.isRequired,
    airResistance: PropTypes.number.isRequired,
  }).isRequired,
  isPlaying: PropTypes.bool.isRequired,
};

export default PhysicsSimulation;
