import { Box, Paper } from '@mui/material';
import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const VisualizationPreview = ({ visualization, onUpdate }) => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const frameIdRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });

    renderer.setSize(
      canvasRef.current.clientWidth,
      canvasRef.current.clientHeight
    );
    renderer.setClearColor(visualization.settings.backgroundColor || '#000000');

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);

    // Set camera position
    camera.position.z = 5;

    // Store refs
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Handle window resize
    const handleResize = () => {
      if (!canvasRef.current || !renderer || !camera) return;

      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      if (visualization.settings.autoRotate) {
        // Add rotation animation
        scene.rotation.y += 0.01;
      }

      renderer.render(scene, camera);
    };

    // Start animation
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [
    visualization.settings.backgroundColor,
    visualization.settings.autoRotate,
  ]);

  // Update visualization based on settings changes
  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current) return;

    // Update renderer settings
    rendererRef.current.setClearColor(
      visualization.settings.backgroundColor || '#000000'
    );

    // Update scene objects based on visualization type and settings
    // This is where you would add specific visualization logic
    switch (visualization.type) {
      case 'waveform':
        // Add waveform visualization logic
        break;
      case 'spectrum':
        // Add spectrum visualization logic
        break;
      case 'particles':
        // Add particle system visualization logic
        break;
      default:
        break;
    }
  }, [visualization.type, visualization.settings]);

  return (
    <Paper sx={{ p: 2, height: '600px' }}>
      <Box
        sx={{
          width: '100%',
          height: '100%',
          '& canvas': {
            width: '100% !important',
            height: '100% !important',
          },
        }}
      >
        <canvas ref={canvasRef} />
      </Box>
    </Paper>
  );
};

VisualizationPreview.propTypes = {
  visualization: PropTypes.shape({
    type: PropTypes.string.isRequired,
    settings: PropTypes.shape({
      backgroundColor: PropTypes.string,
      autoRotate: PropTypes.bool,
    }).isRequired,
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default VisualizationPreview;
