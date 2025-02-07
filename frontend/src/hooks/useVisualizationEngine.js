
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';


export const useVisualizationEngine = () => {
  const dispatch = useDispatch();
  const engineState = useRef<VisualizationEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const containerRef = useRef(null);

  const initializeEngine = useCallback(
    (canvas: HTMLCanvasElement, visualization: Visualization) => {
      const engine: VisualizationEngine = {
        scene: new THREE.Scene(),
        camera: new THREE.PerspectiveCamera(
          75,
          visualization.settings.width / visualization.settings.height,
          0.1,
          1000
        ),
        renderer: new THREE.WebGLRenderer({ canvas, antialias: true }),
        objects: [],
        data: null,
      };

      engine.renderer.setSize(visualization.settings.width, visualization.settings.height);
      engine.renderer.setClearColor(visualization.settings.backgroundColor);

      if (visualization.type === 'custom' || visualization.type === 'spectrogram') {
        engine.controls = new OrbitControls(engine.camera, canvas);
        engine.controls.enableDamping = true;
        engine.controls.dampingFactor = 0.05;
      }

      // Add default lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 5, 5);
      engine.scene.add(ambientLight);
      engine.scene.add(directionalLight);

      // Add visualization-specific objects
      switch (visualization.type) {
        case 'waveform':
          const waveformGeometry = new THREE.BufferGeometry();
          const waveformMaterial = new THREE.LineBasicMaterial({
            color: visualization.settings.foregroundColor,
          });
          const waveformLine = new THREE.Line(waveformGeometry, waveformMaterial);
          engine.objects.push(waveformLine);
          engine.scene.add(waveformLine);
          engine.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
          engine.camera.position.z = 5;
          break;

        case 'spectrum':
          const spectrumGeometry = new THREE.BufferGeometry();
          const spectrumMaterial = new THREE.LineBasicMaterial({
            color: visualization.settings.foregroundColor,
          });
          const spectrumLine = new THREE.Line(spectrumGeometry, spectrumMaterial);
          engine.objects.push(spectrumLine);
          engine.scene.add(spectrumLine);
          engine.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
          engine.camera.position.z = 5;
          break;

        case 'spectrogram':
          const spectrogramGeometry = new THREE.PlaneGeometry(1, 1);
          const spectrogramMaterial = new THREE.MeshBasicMaterial({
            color: visualization.settings.foregroundColor,
            side: THREE.DoubleSide,
          });
          const spectrogramMesh = new THREE.Mesh(spectrogramGeometry, spectrogramMaterial);
          engine.objects.push(spectrogramMesh);
          engine.scene.add(spectrogramMesh);
          engine.camera.position.z = 5;
          break;

        case 'custom':
          // Custom visualization setup will be handled by the visualization's own setup logic
          break;
      }

      if (visualization.settings.showGrid) {
        const grid = new THREE.GridHelper(10, 10);
        engine.scene.add(grid);
      }

      if (visualization.settings.showAxes) {
        const axes = new THREE.AxesHelper(5);
        engine.scene.add(axes);
      }

      return engine;
    },
    []
  );

  const updateVisualization = useCallback(
    (engine: VisualizationEngine, visualization: Visualization) => {
      if (!engine || !visualization.data) return;

      // Update visualization-specific objects
      switch (visualization.type) {
        case 'waveform':
          if (Array.isArray(visualization.data)) {
            const waveformLine = engine.objects[0] as THREE.Line;
            const positions = new Float32Array(visualization.data.length * 3);
            for (let i = 0; i < visualization.data.length; i++) {
              positions[i * 3] = (i / visualization.data.length) * 2 - 1;
              positions[i * 3 + 1] = visualization.data[i];
              positions[i * 3 + 2] = 0;
            }
            (waveformLine.geometry as THREE.BufferGeometry).setAttribute(
              'position',
              new THREE.BufferAttribute(positions, 3)
            );
          }
          break;

        case 'spectrum':
          if (Array.isArray(visualization.data)) {
            const spectrumLine = engine.objects[0] as THREE.Line;
            const positions = new Float32Array(visualization.data.length * 3);
            for (let i = 0; i < visualization.data.length; i++) {
              positions[i * 3] = (i / visualization.data.length) * 2 - 1;
              positions[i * 3 + 1] = visualization.data[i];
              positions[i * 3 + 2] = 0;
            }
            (spectrumLine.geometry as THREE.BufferGeometry).setAttribute(
              'position',
              new THREE.BufferAttribute(positions, 3)
            );
          }
          break;

        case 'spectrogram':
          // Update spectrogram texture based on visualization data
          break;

        case 'custom':
          // Custom visualization update will be handled by the visualization's own update logic
          break;
      }

      // Update controls if they exist
      if (engine.controls) {
        engine.controls.update();
      }

      // Render the scene
      engine.renderer.render(engine.scene, engine.camera);
    },
    []
  );

  const cleanupEngine = useCallback((engine: VisualizationEngine) => {
    if (!engine) return;

    // Dispose of geometries and materials
    engine.objects.forEach(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        (object.material as THREE.Material).dispose();
      } else if (object instanceof THREE.Line) {
        object.geometry.dispose();
        (object.material as THREE.Material).dispose();
      }
    });

    // Dispose of the renderer
    engine.renderer.dispose();

    // Remove controls if they exist
    if (engine.controls) {
      engine.controls.dispose();
    }
  }, []);

  const addObject = useCallback((visualization: Visualization) => {
    if (!engineState.current) return;

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);

    engineState.current.scene.add(mesh);
    engineState.current.objects.push(mesh);
  }, []);

  const removeObject = useCallback((id: number) => {
    if (!engineState.current) return;

    const object = engineState.current.objects.find(o => o.id === id);
    if (object) {
      engineState.current.scene.remove(object);
      engineState.current.objects.splice(engineState.current.objects.indexOf(object), 1);
    }
  }, []);

  const updateObject = useCallback((id: number, data: any) => {
    if (!engineState.current) return;

    const object = engineState.current.objects.find(o => o.id === id);
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
    updateVisualization,
    cleanupEngine,
    addObject,
    removeObject,
    updateObject,
  };
};
