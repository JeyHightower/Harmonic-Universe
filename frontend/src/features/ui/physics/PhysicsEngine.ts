import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Box, IconButton, Tooltip } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    selectPhysicsObjects,
    selectSimulationInProgress,
    simulateScene
} from '../store/physicsSlice';

const PhysicsEngine = ({ sceneId, width = 800, height = 600 }) => {
  const dispatch = useDispatch();
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const physicsObjects = useSelector(selectPhysicsObjects);
  const simulationInProgress = useSelector(selectSimulationInProgress);

  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.scale(1, -1); // Flip y-axis to match physics coordinates
    ctx.translate(0, -height); // Move origin to bottom-left
  }, [height]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const animate = async () => {
      if (!simulationInProgress) {
        await dispatch(simulateScene(sceneId));
      }
      renderScene();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, sceneId, dispatch, simulationInProgress]);

  const renderScene = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Render each physics object
    Object.values(physicsObjects).forEach(object => {
      if (object.scene_id === sceneId) {
        renderObject(ctx, object);
      }
    });
  };

  const renderObject = (ctx, object) => {
    ctx.save();

    // Set object style
    ctx.fillStyle = object.is_static ? '#666666' : '#4CAF50';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    // Transform context for object
    ctx.translate(object.position.x, object.position.y);
    ctx.rotate(object.angle);

    // Draw object based on type
    switch (object.object_type) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, object.dimensions.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Draw a line to show rotation
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(object.dimensions.radius, 0);
        ctx.stroke();
        break;

      case 'rectangle':
        const width = object.dimensions.width;
        const height = object.dimensions.height;
        ctx.beginPath();
        ctx.rect(-width/2, -height/2, width, height);
        ctx.fill();
        ctx.stroke();
        break;

      // Add more shape types as needed

      default:
        console.warn(`Unknown object type: ${object.object_type}`);
    }

    ctx.restore();
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    // Reset physics objects to their initial positions
    // This would require adding initial_position to the physics object model
    // and implementing a reset endpoint in the backend
    setIsPlaying(false);
    // TODO: Implement reset functionality
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          border: '1px solid #ccc',
          backgroundColor: '#f5f5f5'
        }}
      />

      <Box sx={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 20,
        padding: 1
      }}>
        <Tooltip title="Reset">
          <IconButton onClick={handleReset} disabled={simulationInProgress}>
            <RestartAltIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title={isPlaying ? "Pause" : "Play"}>
          <IconButton onClick={handlePlayPause} disabled={simulationInProgress}>
            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default PhysicsEngine;
