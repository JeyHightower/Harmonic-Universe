import { useEffect, useRef, useState } from 'react';

export function useVisualization(canvasRef, initialParams = {}) {
  const glRef = useRef(null);
  const programRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const defaultParams = {
    particleDensity: 50,
    colorScheme: 'classic',
    effectIntensity: 0.5,
    ...initialParams,
  };

  const [params, setParams] = useState(defaultParams);

  // Shader sources
  const vertexShaderSource = `
    attribute vec2 position;
    attribute vec2 velocity;
    varying vec2 vVelocity;

    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
      gl_PointSize = 2.0;
      vVelocity = velocity;
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;
    varying vec2 vVelocity;
    uniform vec3 uColor;
    uniform float uIntensity;

    void main() {
      float speed = length(vVelocity);
      vec3 color = uColor * (1.0 + speed * uIntensity);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  useEffect(() => {
    const initGL = () => {
      const canvas = canvasRef.current;
      const gl = canvas.getContext('webgl2');

      if (!gl) {
        console.error('WebGL2 not supported');
        return false;
      }

      // Create shaders
      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, vertexShaderSource);
      gl.compileShader(vertexShader);

      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, fragmentShaderSource);
      gl.compileShader(fragmentShader);

      // Create program
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Failed to link program:', gl.getProgramInfoLog(program));
        return false;
      }

      gl.useProgram(program);

      // Store references
      glRef.current = gl;
      programRef.current = program;

      // Set up initial attributes and uniforms
      setupAttributes();
      updateUniforms();

      return true;
    };

    const setupAttributes = () => {
      const gl = glRef.current;
      const program = programRef.current;

      // Position attribute
      const positionBuffer = gl.createBuffer();
      const positionLocation = gl.getAttribLocation(program, 'position');
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      // Velocity attribute
      const velocityBuffer = gl.createBuffer();
      const velocityLocation = gl.getAttribLocation(program, 'velocity');
      gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer);
      gl.enableVertexAttribArray(velocityLocation);
      gl.vertexAttribPointer(velocityLocation, 2, gl.FLOAT, false, 0, 0);
    };

    const updateUniforms = () => {
      const gl = glRef.current;
      const program = programRef.current;

      // Color uniform based on scheme
      const colorLocation = gl.getUniformLocation(program, 'uColor');
      const colors = {
        classic: [0.4, 0.6, 1.0],
        neon: [1.0, 0.2, 0.8],
        monochrome: [0.8, 0.8, 0.8],
      };
      gl.uniform3fv(
        colorLocation,
        colors[params.colorScheme] || colors.classic
      );

      // Effect intensity uniform
      const intensityLocation = gl.getUniformLocation(program, 'uIntensity');
      gl.uniform1f(intensityLocation, params.effectIntensity);
    };

    if (!isInitialized && canvasRef.current) {
      const success = initGL();
      if (success) {
        setIsInitialized(true);
      }
    }

    return () => {
      if (glRef.current) {
        const gl = glRef.current;
        const program = programRef.current;

        gl.deleteProgram(program);
        // Clean up other WebGL resources
      }
    };
  }, [canvasRef]);

  useEffect(() => {
    if (isInitialized) {
      const gl = glRef.current;
      gl.useProgram(programRef.current);
      updateUniforms();
    }
  }, [params]);

  const updateParams = newParams => {
    setParams(prev => ({
      ...prev,
      ...newParams,
    }));
  };

  const draw = (positions, velocities) => {
    if (!isInitialized) return;

    const gl = glRef.current;

    // Update position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Update velocity buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(velocities),
      gl.STATIC_DRAW
    );

    // Clear and draw
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, positions.length / 2);
  };

  const resize = () => {
    if (!isInitialized) return;

    const canvas = canvasRef.current;
    const gl = glRef.current;

    // Update canvas size
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  return {
    isInitialized,
    params,
    updateParams,
    draw,
    resize,
  };
}
