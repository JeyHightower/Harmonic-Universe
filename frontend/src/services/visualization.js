import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import axiosInstance from './api';

// API Service Methods
const apiService = {
  fetchAll: async () => {
    const response = await axiosInstance.get('/visualization');
    return response.data;
  },

  create: async data => {
    const response = await axiosInstance.post('/visualization', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axiosInstance.patch(`/visualization/${id}`, data);
    return response.data;
  },

  delete: async id => {
    await axiosInstance.delete(`/visualization/${id}`);
  },

  updateDataMappings: async (id, mappings) => {
    await axiosInstance.patch(`/visualization/${id}/mappings`, { mappings });
  },

  updateStreamConfig: async (id, config) => {
    await axiosInstance.patch(`/visualization/${id}/stream`, config);
  },

  startStream: async id => {
    await axiosInstance.post(`/visualization/${id}/stream/start`);
  },

  stopStream: async id => {
    await axiosInstance.post(`/visualization/${id}/stream/stop`);
  },
};

class VisualizationService {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.objects = {};
    this.isInitialized = false;
    this.animationFrameId = null;
  }

  // Scene Management
  initialize(container) {
    if (this.isInitialized) return;

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Controls setup
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 10);
    this.scene.add(gridHelper);

    this.isInitialized = true;
    this.animate();

    // Handle resize
    window.addEventListener('resize', () => this.handleResize(container));
  }

  handleResize(container) {
    if (!this.camera || !this.renderer) return;

    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  animate = () => {
    if (!this.scene || !this.camera || !this.renderer || !this.controls) return;

    this.animationFrameId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  // Object Management
  addObject(visualization) {
    if (!this.scene) return;

    let object;

    switch (visualization.type) {
      case '3d':
        object = this.create3DObject(visualization);
        break;
      case 'waveform':
        object = this.createWaveformObject(visualization);
        break;
      case 'spectrogram':
        object = this.createSpectrogramObject(visualization);
        break;
      case 'realtime':
        object = this.createRealtimeObject(visualization);
        break;
      default:
        throw new Error(`Unsupported visualization type: ${visualization.type}`);
    }

    this.scene.add(object);
    this.objects[visualization.id] = object;
  }

  create3DObject(visualization) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: visualization.settings.backgroundColor,
    });
    return new THREE.Mesh(geometry, material);
  }

  createWaveformObject(visualization) {
    const points = [];
    for (let i = 0; i < 100; i++) {
      points.push(new THREE.Vector3(i / 10 - 5, Math.sin(i / 10) * 2, 0));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: visualization.settings.backgroundColor,
    });
    return new THREE.Line(geometry, material);
  }

  createSpectrogramObject(visualization) {
    const geometry = new THREE.PlaneGeometry(10, 5);
    const material = new THREE.MeshBasicMaterial({
      color: visualization.settings.backgroundColor,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    return plane;
  }

  createRealtimeObject(visualization) {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: visualization.settings.backgroundColor,
      wireframe: true,
    });
    return new THREE.Mesh(geometry, material);
  }

  removeObject(id) {
    if (!this.scene) return;

    const object = this.objects[id];
    if (object) {
      this.scene.remove(object);
      delete this.objects[id];
    }
  }

  updateObject(id, data) {
    const object = this.objects[id];
    if (!object) return;

    if (data.position) {
      object.position.set(...data.position);
    }
    if (data.rotation) {
      object.rotation.set(...data.rotation);
    }
    if (data.scale) {
      object.scale.set(...data.scale);
    }
  }

  dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }

    if (this.scene) {
      this.scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.objects = {};
    this.isInitialized = false;
  }
}

// Create and export service instances
const visualizationService = new VisualizationService();
export { apiService, visualizationService as default };
