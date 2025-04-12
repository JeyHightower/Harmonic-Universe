import React, { useEffect, useRef, useState } from "react";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  BufferGeometry,
  BufferAttribute,
  PointsMaterial,
  Points,
  AdditiveBlending,
  Color,
  ShaderMaterial,
} from "three";
import * as THREE from 'three';
import PropTypes from 'prop-types';
import '../styles/MusicVisualizer3D.css';

// Define window globals to fix ESLint errors
const { requestAnimationFrame, cancelAnimationFrame } = window;

/**
 * 3D music visualizer component
 */
const MusicVisualizer3D = ({ isPlaying, musicData, analyzerData }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const particlesRef = useRef(null);
  const starsRef = useRef(null);
  const frameIdRef = useRef(null);
  const visualizerStartTime = useRef(Date.now());
  const effectsRef = useRef({
    energy: 0.5,
    mood: "neutral",
    complexity: 0.5,
    style: "default",
  });
  const [isThreeAvailable, setIsThreeAvailable] = useState(
    typeof THREE !== "undefined" && typeof THREE.Scene === "function"
  );

  // Initialize Three.js scene
  useEffect(() => {
    if (!isThreeAvailable || !containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 30;
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Create stars background
    createStars();

    // Create particle system for music visualization
    createParticles();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current)
        return;

      cameraRef.current.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, [isPlaying, musicData, isThreeAvailable]);

  // Create particle system
  const createParticles = () => {
    if (!sceneRef.current) return;

    // Clean up existing particles
    if (particlesRef.current) {
      sceneRef.current.remove(particlesRef.current);
    }

    // Particle count based on complexity of music (if available)
    const particleCount = musicData?.melody?.length
      ? musicData.melody.length * 100
      : 1000;

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    // Initialize particles in a sphere formation
    const radius = 20;

    for (let i = 0; i < particleCount; i++) {
      // Position
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta); // x
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta); // y
      positions[i * 3 + 2] = radius * Math.cos(phi); // z

      // Color - based on position (creates a gradient)
      colors[i * 3] = 0.5 + positions[i * 3] / radius / 2; // r
      colors[i * 3 + 1] = 0.5 + positions[i * 3 + 1] / radius / 2; // g
      colors[i * 3 + 2] = 0.5 + positions[i * 3 + 2] / radius / 2; // b

      // Size
      sizes[i] = Math.random() * 0.5 + 0.5;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    // Create material
    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      sizeAttenuation: true,
    });

    // Create points
    const particles = new THREE.Points(geometry, material);
    sceneRef.current.add(particles);
    particlesRef.current = particles;
  };

  // Create stars background
  const createStars = () => {
    if (!sceneRef.current) return;

    // Clean up existing stars
    if (starsRef.current) {
      sceneRef.current.remove(starsRef.current);
    }

    const starCount = 2000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    // Create stars in a sphere around the scene
    const radius = 200;
    for (let i = 0; i < starCount; i++) {
      // Randomize position in a sphere
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      // Randomize size
      starSizes[i] = Math.random() * 2 + 0.5;
    }

    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(starPositions, 3)
    );
    starGeometry.setAttribute("size", new THREE.BufferAttribute(starSizes, 1));

    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        pointTexture: { value: null }, // We'll use a simple shader without texture
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = vec3(1.0, 1.0, 1.0);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float r = distance(gl_PointCoord, vec2(0.5, 0.5));
          if (r > 0.5) discard;
          float intensity = 1.0 - 2.0 * r;
          gl_FragColor = vec4(vColor, intensity);
        }
      `,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    sceneRef.current.add(stars);
    starsRef.current = stars;
  };

  // Animation loop
  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      if (!isPlaying) {
        // Idle animation when not playing
        rotateScene(0.0005);
      } else if (particlesRef.current && analyzerData) {
        // Active animation when playing music
        updateParticles(analyzerData);
      }

      // Render scene
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animate();

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [isPlaying, analyzerData]);

  // React to music data changes
  useEffect(() => {
    if (musicData) {
      // Recreate the particles when music data changes
      createParticles();

      // Update effects based on AI metadata if available
      if (musicData.ai_metadata) {
        effectsRef.current = {
          energy: musicData.ai_metadata.energy || 0.5,
          mood: musicData.ai_metadata.mood || "neutral",
          complexity: musicData.ai_metadata.complexity || 0.5,
          style: musicData.ai_metadata.style || "default",
        };

        // Update scene based on style
        updateSceneForStyle(musicData.ai_metadata.style);
      }
    }
  }, [musicData]);

  // Update scene appearance based on AI style
  const updateSceneForStyle = (style) => {
    if (!sceneRef.current) return;

    switch (style) {
      case "ambient":
        // Slower, more ethereal movement with soft blue/purple colors
        if (particlesRef.current) {
          const colors = particlesRef.current.geometry.attributes.color;
          for (let i = 0; i < colors.count; i++) {
            colors.setXYZ(
              i,
              0.2 + Math.random() * 0.2, // soft blue
              0.3 + Math.random() * 0.2, // with purple
              0.5 + Math.random() * 0.3 // highlights
            );
          }
          colors.needsUpdate = true;
        }
        break;

      case "classical":
        // More ordered, golden/warm colors
        if (particlesRef.current) {
          const colors = particlesRef.current.geometry.attributes.color;
          for (let i = 0; i < colors.count; i++) {
            colors.setXYZ(
              i,
              0.5 + Math.random() * 0.3, // gold
              0.4 + Math.random() * 0.2, // warm
              0.2 + Math.random() * 0.1 // hues
            );
          }
          colors.needsUpdate = true;
        }
        break;

      case "electronic":
        // Vibrant, techy colors with more motion
        if (particlesRef.current) {
          const colors = particlesRef.current.geometry.attributes.color;
          for (let i = 0; i < colors.count; i++) {
            colors.setXYZ(
              i,
              0.3 + Math.random() * 0.7, // neon
              0.6 + Math.random() * 0.4, // green/blue
              0.7 + Math.random() * 0.3 // highlights
            );
          }
          colors.needsUpdate = true;
        }
        break;

      case "jazz":
        // Deep, rich colors with subtle variations
        if (particlesRef.current) {
          const colors = particlesRef.current.geometry.attributes.color;
          for (let i = 0; i < colors.count; i++) {
            colors.setXYZ(
              i,
              0.4 + Math.random() * 0.3, // deep red
              0.1 + Math.random() * 0.2, // hints of 
              0.3 + Math.random() * 0.2 // purple/blue
            );
          }
          colors.needsUpdate = true;
        }
        break;

      case "epic":
        // Bold, dramatic colors with strong movement
        if (particlesRef.current) {
          const colors = particlesRef.current.geometry.attributes.color;
          for (let i = 0; i < colors.count; i++) {
            colors.setXYZ(
              i,
              0.6 + Math.random() * 0.4, // bold reds
              0.2 + Math.random() * 0.3, // with orange
              0.1 + Math.random() * 0.3 // and hints of gold
            );
          }
          colors.needsUpdate = true;
        }
        break;

      default:
        // Default - rainbow gradient
        if (particlesRef.current) {
          const positions = particlesRef.current.geometry.attributes.position;
          const colors = particlesRef.current.geometry.attributes.color;
          const radius = 20;

          for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);

            colors.setXYZ(
              i,
              0.5 + x / radius / 2, // r
              0.5 + y / radius / 2, // g
              0.5 + z / radius / 2 // b
            );
          }
          colors.needsUpdate = true;
        }
    }
  };

  // Update particles based on analyzer data
  const updateParticles = (dataArray) => {
    if (!particlesRef.current || !musicData) return;

    const particles = particlesRef.current;
    const positions = particles.geometry.attributes.position.array;
    const sizes = particles.geometry.attributes.size.array;
    const particleCount = sizes.length;

    // Calculate overall intensity of the sound
    const intensity =
      dataArray.reduce((sum, value) => sum + Math.abs(value), 0) /
      dataArray.length;

    // Update particles based on audio data and elapsed time
    const time = (Date.now() - visualizerStartTime.current) / 1000;
    const tempo = musicData.tempo / 60; // Beats per second

    // Apply effects based on AI metadata
    const effects = effectsRef.current;
    const energyFactor = effects.energy || 0.5;
    const complexityFactor = effects.complexity || 0.5;

    for (let i = 0; i < particleCount; i++) {
      // Get the particle's current position
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];

      // Get distance from origin
      const distance = Math.sqrt(x * x + y * y + z * z);

      // Pulsate based on beat and energy
      const pulseFactor = 0.05 * Math.sin(time * tempo * Math.PI) + 1;

      // Apply modifier from analyzer data
      const dataIndex = Math.floor((i / particleCount) * dataArray.length);
      const dataValue = Math.abs(dataArray[dataIndex] || 0);

      // Modify particle position based on AI energy factor
      const newDistance =
        distance * (pulseFactor + dataValue * 0.2 * energyFactor);
      const scale = newDistance / distance;

      positions[i * 3] = x * scale;
      positions[i * 3 + 1] = y * scale;
      positions[i * 3 + 2] = z * scale;

      // Update particle size based on analyzer data, beat, and complexity
      sizes[i] =
        (0.5 + Math.random() * 0.5 * complexityFactor) *
        (1 + dataValue + 0.1 * Math.sin(time * tempo * Math.PI) * energyFactor);
    }

    // Mark attributes for update
    particles.geometry.attributes.position.needsUpdate = true;
    particles.geometry.attributes.size.needsUpdate = true;

    // Also rotate the scene based on the beat and energy
    rotateScene(0.001 + 0.001 * intensity * energyFactor);
  };

  // Rotate the entire scene
  const rotateScene = (speed) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += speed;
      particlesRef.current.rotation.x += speed * 0.5;
    }
    if (starsRef.current) {
      starsRef.current.rotation.y += speed * 0.2;
    }
  };

  if (!isThreeAvailable) {
    return (
      <div className="visualizer-fallback">
        <p>3D visualization not available (Three.js library not loaded)</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 0,
      }}
    />
  );
};

MusicVisualizer3D.propTypes = {
  isPlaying: PropTypes.bool.isRequired,
  musicData: PropTypes.object,
  analyzerData: PropTypes.array,
};

export default MusicVisualizer3D; 