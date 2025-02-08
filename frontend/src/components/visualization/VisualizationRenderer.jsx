import {
  initAudioAnalysis,
  initWebGL,
  selectAudioAnalysisState,
  selectCurrentVisualization,
  selectWebGLState,
  updateAudioData,
} from '@/store/slices/visualizationSlice';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { createEffect } from './effects';

const VisualizationRenderer = ({ width, height }) => {
  const dispatch = useDispatch();
  const canvasRef = useRef(null);
  const webglState = useSelector(selectWebGLState);
  const audioState = useSelector(selectAudioAnalysisState);
  const visualization = useSelector(selectCurrentVisualization);
  const [animationFrame, setAnimationFrame] = useState(null);
  const [effectComposer, setEffectComposer] = useState(null);
  const [activeEffects, setActiveEffects] = useState({});

  // Initialize WebGL
  useEffect(() => {
    if (!canvasRef.current || webglState.initialized) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: visualization?.settings?.webgl?.antialias ?? true,
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, visualization?.settings?.webgl?.pixelRatio ?? 1)
    );

    const controls = new OrbitControls(camera, renderer.domElement);
    camera.position.z = 5;
    controls.enableDamping = true;

    // Initialize post-processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    if (visualization?.settings?.webgl?.postProcessing?.bloom) {
      const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
      composer.addPass(bloomPass);
    }

    setEffectComposer(composer);

    dispatch(
      initWebGL({
        context: renderer.getContext(),
        renderer,
        scene,
        camera,
        controls,
      })
    );

    return () => {
      controls.dispose();
      renderer.dispose();
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [canvasRef, width, height, visualization?.settings?.webgl]);

  // Initialize Audio Analysis
  useEffect(() => {
    if (audioState.initialized) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = visualization?.settings?.audioAnalysis?.fftSize ?? 2048;
    analyser.smoothingTimeConstant =
      visualization?.settings?.audioAnalysis?.smoothingTimeConstant ?? 0.8;
    analyser.minDecibels = visualization?.settings?.audioAnalysis?.minDecibels ?? -100;
    analyser.maxDecibels = visualization?.settings?.audioAnalysis?.maxDecibels ?? -30;

    const timeData = new Float32Array(analyser.frequencyBinCount);
    const frequencyData = new Float32Array(analyser.frequencyBinCount);

    dispatch(
      initAudioAnalysis({
        context: audioContext,
        analyser,
        timeData,
        frequencyData,
        bands: {},
      })
    );

    return () => {
      audioContext.close();
    };
  }, []);

  // Manage effects
  useEffect(() => {
    if (!webglState.initialized || !visualization?.settings?.effects) return;

    // Clean up old effects
    Object.values(activeEffects).forEach(effect => effect.dispose());

    // Create new effects
    const newEffects = {};
    visualization.settings.effects.forEach(effectConfig => {
      if (!effectConfig.enabled) return;
      try {
        newEffects[effectConfig.id] = createEffect(effectConfig.type, webglState.scene, {
          ...effectConfig.parameters,
          color:
            visualization.settings.color_scheme?.[effectConfig.parameters.colorSource] ||
            effectConfig.parameters.color,
        });
      } catch (error) {
        console.error(`Failed to create effect: ${effectConfig.type}`, error);
      }
    });

    setActiveEffects(newEffects);

    return () => {
      Object.values(newEffects).forEach(effect => effect.dispose());
    };
  }, [webglState.initialized, visualization?.settings?.effects]);

  // Animation Loop
  useEffect(() => {
    if (!webglState.initialized || !audioState.initialized) return;

    const animate = () => {
      const frame = requestAnimationFrame(animate);
      setAnimationFrame(frame);

      // Update audio data
      audioState.analyser.getFloatTimeDomainData(audioState.timeData);
      audioState.analyser.getFloatFrequencyData(audioState.frequencyData);

      // Calculate frequency bands
      const bands = {};
      visualization?.settings?.audioAnalysis?.frequencyBands?.forEach(band => {
        const { min, max, name } = band;
        const frequencies = audioState.frequencyData.slice(
          Math.floor((min / 24000) * audioState.analyser.frequencyBinCount),
          Math.floor((max / 24000) * audioState.analyser.frequencyBinCount)
        );
        bands[name] = frequencies.reduce((sum, val) => sum + val, 0) / frequencies.length;
      });

      dispatch(
        updateAudioData({
          timeData: Array.from(audioState.timeData),
          frequencyData: Array.from(audioState.frequencyData),
          bands,
        })
      );

      // Update active effects
      Object.entries(activeEffects).forEach(([id, effect]) => {
        const effectConfig = visualization?.settings?.effects?.find(e => e.id === id);
        if (effectConfig?.enabled) {
          switch (effectConfig.type) {
            case 'waveform':
              effect.update(audioState.timeData);
              break;
            case 'spectrum':
              effect.update(audioState.frequencyData);
              break;
            case 'particles':
            case 'kaleidoscope':
              effect.update(bands);
              break;
          }
        }
      });

      // Render
      webglState.controls.update();
      effectComposer?.render();
    };

    animate();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [
    webglState.initialized,
    audioState.initialized,
    visualization?.settings?.effects,
    activeEffects,
  ]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
      }}
    />
  );
};

export default VisualizationRenderer;
