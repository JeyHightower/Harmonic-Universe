import * as THREE from 'three';

export class WaveformEffect {
  constructor(scene, parameters = {}) {
    this.scene = scene;
    this.parameters = {
      color: parameters.color || '#1976d2',
      width: parameters.width || 100,
      height: parameters.height || 50,
      segments: parameters.segments || 128,
      amplitude: parameters.amplitude || 30,
      thickness: parameters.thickness || 2,
    };

    this.initialize();
  }

  initialize() {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({
      color: this.parameters.color,
      linewidth: this.parameters.thickness,
    });

    const positions = new Float32Array(this.parameters.segments * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.line = new THREE.Line(geometry, material);
    this.scene.add(this.line);
  }

  update(timeData) {
    const positions = this.line.geometry.attributes.position.array;

    for (let i = 0; i < this.parameters.segments; i++) {
      const t = i / this.parameters.segments;
      const x = (t - 0.5) * this.parameters.width;
      const y = timeData[i] * this.parameters.amplitude;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = 0;
    }

    this.line.geometry.attributes.position.needsUpdate = true;
  }

  dispose() {
    this.line.geometry.dispose();
    this.line.material.dispose();
    this.scene.remove(this.line);
  }
}

export class SpectrumEffect {
  constructor(scene, parameters = {}) {
    this.scene = scene;
    this.parameters = {
      color: parameters.color || '#9c27b0',
      width: parameters.width || 100,
      height: parameters.height || 50,
      bars: parameters.bars || 64,
      spacing: parameters.spacing || 0.5,
      smoothing: parameters.smoothing || 0.8,
    };

    this.initialize();
  }

  initialize() {
    this.bars = [];
    const barWidth = (this.parameters.width / this.parameters.bars) * (1 - this.parameters.spacing);
    const material = new THREE.MeshPhongMaterial({
      color: this.parameters.color,
      shininess: 100,
    });

    for (let i = 0; i < this.parameters.bars; i++) {
      const geometry = new THREE.BoxGeometry(barWidth, 1, 1);
      const bar = new THREE.Mesh(geometry, material);
      const x = (i - this.parameters.bars / 2) * (barWidth / (1 - this.parameters.spacing));
      bar.position.set(x, 0, 0);
      this.bars.push(bar);
      this.scene.add(bar);
    }
  }

  update(frequencyData) {
    for (let i = 0; i < this.parameters.bars; i++) {
      const value = frequencyData[i] / 255;
      const height = Math.max(0.1, value * this.parameters.height);
      this.bars[i].scale.y = height;
      this.bars[i].position.y = height / 2;
    }
  }

  dispose() {
    this.bars.forEach(bar => {
      bar.geometry.dispose();
      bar.material.dispose();
      this.scene.remove(bar);
    });
  }
}

export class ParticleEffect {
  constructor(scene, parameters = {}) {
    this.scene = scene;
    this.parameters = {
      count: parameters.count || 1000,
      size: parameters.size || 0.1,
      color: parameters.color || '#ff4081',
      speed: parameters.speed || 0.5,
      spread: parameters.spread || 100,
      sensitivity: parameters.sensitivity || 1,
    };

    this.initialize();
  }

  initialize() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.parameters.count * 3);
    const velocities = new Float32Array(this.parameters.count * 3);

    for (let i = 0; i < this.parameters.count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * this.parameters.spread;
      positions[i3 + 1] = (Math.random() - 0.5) * this.parameters.spread;
      positions[i3 + 2] = (Math.random() - 0.5) * this.parameters.spread;

      velocities[i3] = (Math.random() - 0.5) * this.parameters.speed;
      velocities[i3 + 1] = (Math.random() - 0.5) * this.parameters.speed;
      velocities[i3 + 2] = (Math.random() - 0.5) * this.parameters.speed;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.velocities = velocities;

    const material = new THREE.PointsMaterial({
      color: this.parameters.color,
      size: this.parameters.size,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  update(bands) {
    const positions = this.particles.geometry.attributes.position.array;
    const bassIntensity = bands['bass'] || 0;
    const midIntensity = bands['mid'] || 0;
    const highIntensity = bands['presence'] || 0;

    for (let i = 0; i < this.parameters.count; i++) {
      const i3 = i * 3;

      // Update positions based on velocities and audio
      positions[i3] += this.velocities[i3] * bassIntensity * this.parameters.sensitivity;
      positions[i3 + 1] += this.velocities[i3 + 1] * midIntensity * this.parameters.sensitivity;
      positions[i3 + 2] += this.velocities[i3 + 2] * highIntensity * this.parameters.sensitivity;

      // Boundary check
      for (let j = 0; j < 3; j++) {
        if (Math.abs(positions[i3 + j]) > this.parameters.spread) {
          positions[i3 + j] *= -0.9;
          this.velocities[i3 + j] *= -1;
        }
      }
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  dispose() {
    this.particles.geometry.dispose();
    this.particles.material.dispose();
    this.scene.remove(this.particles);
  }
}

export class KaleidoscopeEffect {
  constructor(scene, parameters = {}) {
    this.scene = scene;
    this.parameters = {
      segments: parameters.segments || 8,
      radius: parameters.radius || 50,
      speed: parameters.speed || 0.01,
      color: parameters.color || '#1976d2',
    };

    this.initialize();
  }

  initialize() {
    const geometry = new THREE.CircleGeometry(this.parameters.radius, 64);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        segments: { value: this.parameters.segments },
        radius: { value: this.parameters.radius },
        color: { value: new THREE.Color(this.parameters.color) },
        intensity: { value: 1.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float segments;
        uniform float radius;
        uniform vec3 color;
        uniform float intensity;
        varying vec2 vUv;

        void main() {
          vec2 center = vec2(0.5, 0.5);
          vec2 pos = vUv - center;
          float angle = atan(pos.y, pos.x);
          float segmentAngle = 6.28318 / segments;
          angle = mod(angle, segmentAngle);
          if (angle > segmentAngle * 0.5) {
            angle = segmentAngle - angle;
          }
          vec2 newPos = vec2(cos(angle), sin(angle)) * length(pos);
          newPos = newPos * 0.5 + 0.5;
          float dist = length(pos);
          float alpha = smoothstep(radius * 1.1, radius, dist);
          gl_FragColor = vec4(color * intensity, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
    this.time = 0;
  }

  update(bands) {
    this.time += this.parameters.speed;
    const intensity = (bands['mid'] || 0) * 2;

    this.mesh.material.uniforms.time.value = this.time;
    this.mesh.material.uniforms.intensity.value = intensity;
    this.mesh.rotation.z = this.time * 0.5;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.scene.remove(this.mesh);
  }
}

export const createEffect = (type, scene, parameters) => {
  switch (type) {
    case 'waveform':
      return new WaveformEffect(scene, parameters);
    case 'spectrum':
      return new SpectrumEffect(scene, parameters);
    case 'particles':
      return new ParticleEffect(scene, parameters);
    case 'kaleidoscope':
      return new KaleidoscopeEffect(scene, parameters);
    default:
      throw new Error(`Unknown effect type: ${type}`);
  }
};
