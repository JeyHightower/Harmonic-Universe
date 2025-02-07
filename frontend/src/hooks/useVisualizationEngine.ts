import { Visualization } from '@/types/visualization';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface VisualizationEngineState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  objects: Map<number, THREE.Object3D>;
}

export const useVisualizationEngine = () => {
  const dispatch = useDispatch();
  const engineState = useRef<VisualizationEngineState | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initializeEngine = useCallback(() => {
    if (!containerRef.current || engineState.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Create camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Create controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Create state
    engineState.current = {
      scene,
      camera,
      renderer,
      controls,
      objects: new Map(),
    };

    setIsInitialized(true);

    // Handle resize
    const handleResize = () => {
      if (!engineState.current || !containerRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      engineState.current.camera.aspect = width / height;
      engineState.current.camera.updateProjectionMatrix();
      engineState.current.renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      if (!engineState.current) return;

      requestAnimationFrame(animate);
      engineState.current.controls.update();
      engineState.current.renderer.render(engineState.current.scene, engineState.current.camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (engineState.current) {
        engineState.current.renderer.dispose();
        engineState.current.scene.clear();
        container.removeChild(engineState.current.renderer.domElement);
        engineState.current = null;
      }
    };
  }, []);

  const addObject = useCallback((visualization: Visualization) => {
    if (!engineState.current) return;

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);

    engineState.current.scene.add(mesh);
    engineState.current.objects.set(visualization.id, mesh);
  }, []);

  const removeObject = useCallback((id: number) => {
    if (!engineState.current) return;

    const object = engineState.current.objects.get(id);
    if (object) {
      engineState.current.scene.remove(object);
      engineState.current.objects.delete(id);
    }
  }, []);

  const updateObject = useCallback((id: number, data: any) => {
    if (!engineState.current) return;

    const object = engineState.current.objects.get(id);
    if (object) {
      // Update object based on data
      // This will depend on your visualization requirements
    }
  }, []);

  useEffect(() => {
    return () => {
      if (engineState.current) {
        engineState.current.renderer.dispose();
        engineState.current.scene.clear();
        if (containerRef.current && engineState.current.renderer.domElement) {
          containerRef.current.removeChild(engineState.current.renderer.domElement);
        }
        engineState.current = null;
      }
    };
  }, []);

  return {
    containerRef,
    isInitialized,
    initializeEngine,
    addObject,
    removeObject,
    updateObject,
  };
};
