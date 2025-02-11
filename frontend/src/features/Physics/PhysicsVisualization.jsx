import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useSocket } from '../../hooks/useSocket';
import styles from './PhysicsVisualization.module.css';

const PhysicsVisualization = ({ universeId, initialObjects = [] }) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const objectsRef = useRef(new Map());
  const { socket } = useSocket();
  const [isPlaying, setIsPlaying] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [showVectors, setShowVectors] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 50;
    cameraRef.current = camera;

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setClearColor(0x000000, 1);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Setup controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // Add grid helper
    const gridHelper = new THREE.GridHelper(100, 10);
    scene.add(gridHelper);

    // Initialize objects
    initialObjects.forEach(createObject);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.emit('join_physics', { universe_id: universeId });

    socket.on('physics_update', handlePhysicsUpdate);

    return () => {
      socket.emit('leave_physics', { universe_id: universeId });
      socket.off('physics_update');
    };
  }, [socket, universeId]);

  const createObject = objectData => {
    const { id, position, radius, mass } = objectData;

    // Create sphere geometry
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(Math.random(), Math.random(), Math.random()),
    });
    const sphere = new THREE.Mesh(geometry, material);

    // Set position
    sphere.position.set(...position);

    // Create trail
    const trailGeometry = new THREE.BufferGeometry();
    const trailMaterial = new THREE.LineBasicMaterial({
      color: material.color,
      opacity: 0.5,
      transparent: true,
    });
    const trail = new THREE.Line(trailGeometry, trailMaterial);

    // Create velocity vector
    const arrowHelper = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      sphere.position,
      5,
      0xffff00
    );

    // Add to scene
    sceneRef.current.add(sphere);
    sceneRef.current.add(trail);
    sceneRef.current.add(arrowHelper);

    // Store reference
    objectsRef.current.set(id, {
      sphere,
      trail,
      arrowHelper,
      positions: [position],
    });
  };

  const handlePhysicsUpdate = data => {
    if (!isPlaying) return;

    data.objects.forEach(obj => {
      const object = objectsRef.current.get(obj.id);
      if (!object) {
        createObject(obj);
        return;
      }

      const { sphere, trail, arrowHelper, positions } = object;

      // Update position
      sphere.position.set(...obj.position);

      // Update trail
      if (showTrails) {
        positions.push(obj.position);
        if (positions.length > 100) positions.shift();

        const vertices = positions.flatMap(p => [...p]);
        trail.geometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(vertices, 3)
        );
        trail.geometry.attributes.position.needsUpdate = true;
      }

      // Update velocity vector
      if (showVectors) {
        const velocity = new THREE.Vector3(...obj.velocity);
        const length = velocity.length();
        velocity.normalize();
        arrowHelper.setDirection(velocity);
        arrowHelper.setLength(length * 2);
      }

      arrowHelper.visible = showVectors;
      trail.visible = showTrails;
    });
  };

  const handleResize = () => {
    if (!containerRef.current || !rendererRef.current || !cameraRef.current)
      return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button onClick={() => setShowTrails(!showTrails)}>
          {showTrails ? 'Hide Trails' : 'Show Trails'}
        </button>
        <button onClick={() => setShowVectors(!showVectors)}>
          {showVectors ? 'Hide Vectors' : 'Show Vectors'}
        </button>
      </div>
      <div ref={containerRef} className={styles.canvas} />
    </div>
  );
};

export default PhysicsVisualization;
