import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {
  EffectComposer,
  RenderPass,
  SMAAPass,
  UnrealBloomPass,
} from 'three/examples/jsm/postprocessing/Pass';
import usePhysicsSystem from '../physics/PhysicsSystem';

const PhysicsVisualization = ({ audioUrl, settings }) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const composerRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());

  const [audioData, setAudioData] = useState(null);
  const [scene, physicsApi] = usePhysicsSystem(audioData);
  const analyzer = useAudioAnalyzer(audioUrl);

  useEffect(() => {
    if (!containerRef.current || !scene) return;

    // Initialize Three.js renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 30, 100);
    cameraRef.current = camera;

    // Initialize controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 200;
    controlsRef.current = controls;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Initialize post-processing
    const composer = new EffectComposer(renderer);
    composerRef.current = composer;

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(containerRef.current.clientWidth, containerRef.current.clientHeight),
      1.5,
      0.4,
      0.85
    );
    composer.addPass(bloomPass);

    const smaaPass = new SMAAPass(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    composer.addPass(smaaPass);

    // Handle resize
    const handleResize = () => {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      composer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Update controls
      controls.update();

      // Update audio analysis
      if (analyzer) {
        const frequencies = analyzer.getFrequencyData();
        const waveform = analyzer.getTimeDomainData();
        setAudioData({ frequencies, waveform });

        // Update visual parameters based on audio
        const bassIntensity = frequencies.slice(0, 4).reduce((a, b) => a + b, 0) / 1024;

        bloomPass.strength = 1 + bassIntensity * 2;
        bloomPass.radius = 0.5 + bassIntensity;
      }

      // Render scene
      composer.render();
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
      composer.dispose();
    };
  }, [scene]);

  // Update physics settings when they change
  useEffect(() => {
    if (!settings || !physicsApi) return;

    // Apply new settings to physics system
    physicsApi.reset();

    // Add force fields based on settings
    if (settings.forceFields) {
      settings.forceFields.forEach(field => {
        physicsApi.addForceField(
          new THREE.Vector3(field.x, field.y, field.z),
          field.radius,
          field.strength
        );
      });
    }
  }, [settings, physicsApi]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: 'linear-gradient(to bottom, #000000, #1a1a1a)' }}
    >
      {/* Optional UI overlays */}
      {settings?.showUI && (
        <div className="absolute top-4 left-4 text-white text-sm">
          <div>FPS: {Math.round(1 / clockRef.current.getDelta())}</div>
          <div>Particles: {scene?.children.filter(child => child.isMesh).length || 0}</div>
        </div>
      )}
    </div>
  );
};

export default PhysicsVisualization;
