/**
 * Music Visualization Utilities
 * 
 * This module contains utility functions for creating audio visualizations 
 * with HTML5 Canvas.
 */

// Set of predefined colors for visualizations
export const VISUALIZER_COLORS = {
  background: "rgba(25, 31, 45, 0.9)",
  primary: "#1890ff",
  secondary: "#722ed1",
  accent: "#13c2c2",
  highlight: "#eb2f96",
};

/**
 * Particle class for advanced visualization effects
 */
export class Particle {
  constructor(x, y, size, color, speed) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
    this.speed = speed;
    this.angle = Math.random() * Math.PI * 2;
    this.velocityX = Math.cos(this.angle) * this.speed;
    this.velocityY = Math.sin(this.angle) * this.speed;
    this.alpha = 1;
  }

  update() {
    this.x += this.velocityX;
    this.y += this.velocityY;
    this.alpha -= 0.01;
    this.size -= 0.1;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Creates and initializes a visualizer object
 * @param {HTMLCanvasElement} canvas - The canvas element to draw on
 * @returns {Object} Visualizer state object
 */
export function createVisualizer(canvas) {
  return {
    ctx: canvas.getContext('2d'),
    particles: [],
    colors: VISUALIZER_COLORS,
    width: canvas.width,
    height: canvas.height
  };
}

/**
 * Draws audio visualization on canvas based on audio data
 * @param {HTMLCanvasElement} canvas - The canvas element to draw on
 * @param {Float32Array} dataArray - Audio data from an analyzer node
 * @param {Object} visualizer - Visualizer state object
 * @param {Object} musicData - Optional music data for enhanced visualization
 */
export function drawVisualization(canvas, dataArray, visualizer, musicData = null) {
  const { ctx, particles, colors } = visualizer;
  const width = canvas.width;
  const height = canvas.height;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw background with gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(26, 32, 53, 0.9)");
  gradient.addColorStop(1, "rgba(13, 17, 38, 0.95)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Draw center line
  ctx.beginPath();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  // Draw grid lines
  ctx.beginPath();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  for (let i = 0; i < height; i += 10) {
    ctx.moveTo(0, i);
    ctx.lineTo(width, i);
  }
  for (let i = 0; i < width; i += 20) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i, height);
  }
  ctx.stroke();

  // Draw waveform
  ctx.beginPath();
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 2;

  ctx.moveTo(0, height / 2 + (dataArray[0] * height) / 2);

  for (let i = 1; i < dataArray.length; i++) {
    const x = i * (width / dataArray.length);
    const y = height / 2 + (dataArray[i] * height) / 2;
    ctx.lineTo(x, y);
  }

  ctx.stroke();

  // Add glow effect to waveform
  ctx.shadowBlur = 10;
  ctx.shadowColor = colors.primary;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Draw frequency bars and particles if we have music data
  if (musicData) {
    // Add new particles based on audio data
    const intensity = dataArray.reduce((sum, value) => sum + Math.abs(value), 0) / dataArray.length;

    if (Math.random() < intensity * 0.8 && visualizer.particles.length < 100) {
      const x = Math.random() * width;
      const y = height / 2;
      const size = 3 + Math.random() * 5;
      const color = [
        colors.primary,
        colors.secondary,
        colors.accent,
        colors.highlight,
      ][Math.floor(Math.random() * 4)];
      const speed = 0.5 + Math.random() * 2;

      visualizer.particles.push(new Particle(x, y, size, color, speed));
    }

    // Update and draw particles
    visualizer.particles = visualizer.particles.filter(
      (particle) => particle.alpha > 0 && particle.size > 0
    );
    visualizer.particles.forEach((particle) => {
      particle.update();
      particle.draw(ctx);
    });

    // Draw bars that react to music notes
    const barWidth = width / musicData.melody.length;

    musicData.melody.forEach((note, index) => {
      // Normalize MIDI notes (C4 = 60)
      const notePosition = (note.note - 60) / 36;

      // Get height from note position and current audio data
      const intensityIndex = Math.floor(
        (index / musicData.melody.length) * dataArray.length
      );
      const currentIntensity = Math.abs(dataArray[intensityIndex] || 0);
      const barHeight = 20 + notePosition * 60 + currentIntensity * 40;

      // Position is based on note index
      const x = (index / musicData.melody.length) * width;

      // Color based on note height
      const barColor = `hsl(${180 + notePosition * 120}, 80%, 60%)`;

      // Draw with glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = barColor;
      ctx.fillStyle = barColor;

      // Make the bars thinner and with rounded tops
      const finalBarWidth = barWidth * 0.7;
      ctx.beginPath();
      ctx.roundRect(
        x + (barWidth - finalBarWidth) / 2,
        height - barHeight,
        finalBarWidth,
        barHeight,
        [4, 4, 0, 0]
      );
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }
}

/**
 * Draws placeholder when visualizer is not active
 * @param {HTMLCanvasElement} canvas - The canvas element to draw on
 */
export function drawPlaceholder(canvas) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw background
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(26, 32, 53, 0.9)");
  gradient.addColorStop(1, "rgba(13, 17, 38, 0.95)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Draw placeholder text
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Click play to start visualization", width / 2, height / 2);
} 