import { useEffect, useRef } from 'react';
import styles from './AudioVisualizer.module.css';

const AudioVisualizer = ({ audioData, isPlaying }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();

    const setupAudio = async () => {
      const audio = new Audio(audioData);
      const source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;

        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        const barWidth = (WIDTH / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for(let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i] / 2;

          const r = barHeight + (25 * (i/bufferLength));
          const g = 250 * (i/bufferLength);
          const b = 50;

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

          x += barWidth + 1;
        }

        animationRef.current = requestAnimationFrame(draw);
      };

      if (isPlaying) {
        audio.play();
        draw();
      }

      return () => {
        audio.pause();
        cancelAnimationFrame(animationRef.current);
      };
    };

    setupAudio();

    return () => {
      cancelAnimationFrame(animationRef.current);
      if (audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [audioData, isPlaying]);

  return (
    <div className={styles.visualizer}>
      <canvas
        ref={canvasRef}
        width="800"
        height="200"
        className={styles.canvas}
      />
    </div>
  );
};

export default AudioVisualizer;
