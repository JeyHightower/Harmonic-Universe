import React, { useEffect, useRef } from 'react';
import styles from './PhysicsVisualizer.module.css';

class Particle {
  constructor(x, y, radius = 5) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.vx = (Math.random() - 0.5) * 5;
    this.vy = (Math.random() - 0.5) * 5;
    this.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
  }

  update(parameters, width, height, dt = 0.016) {
    // Apply gravity
    this.vy += parameters.gravity * dt;

    // Apply air resistance
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const dragForce =
      parameters.airResistance * speed * speed * parameters.density;
    const dragX = (dragForce * this.vx) / speed;
    const dragY = (dragForce * this.vy) / speed;

    this.vx -= dragX * dt;
    this.vy -= dragY * dt;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Handle collisions with walls
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx = -this.vx * parameters.elasticity;
      this.vx *= 1 - parameters.friction;
    } else if (this.x + this.radius > width) {
      this.x = width - this.radius;
      this.vx = -this.vx * parameters.elasticity;
      this.vx *= 1 - parameters.friction;
    }

    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy = -this.vy * parameters.elasticity;
      this.vy *= 1 - parameters.friction;
    } else if (this.y + this.radius > height) {
      this.y = height - this.radius;
      this.vy = -this.vy * parameters.elasticity;
      this.vy *= 1 - parameters.friction;
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}

const PhysicsVisualizer = ({ parameters }) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Initialize particles if not already done
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 50; i++) {
        particlesRef.current.push(
          new Particle(Math.random() * width, Math.random() * height)
        );
      }
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(0, 0, width, height);

      particlesRef.current.forEach(particle => {
        particle.update(parameters, width, height);
        particle.draw(ctx);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [parameters]);

  const handleCanvasClick = event => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Add a new particle at click location
    particlesRef.current.push(new Particle(x, y));

    // Keep particle count manageable
    if (particlesRef.current.length > 100) {
      particlesRef.current.shift();
    }
  };

  return (
    <div className={styles.visualizerContainer}>
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className={styles.canvas}
        onClick={handleCanvasClick}
      />
    </div>
  );
};

export default PhysicsVisualizer;
