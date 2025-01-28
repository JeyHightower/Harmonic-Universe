import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import { calculateHarmonyColor } from '../../utils/colorUtils';
import styles from './TimelineVisualization.module.css';

const TimelineNode = ({
  storyboard,
  x,
  y,
  isSelected,
  onClick,
  onEdit,
  onDelete,
}) => (
  <div
    className={`${styles.timelineNode} ${isSelected ? styles.selected : ''}`}
    style={{
      left: `${x}px`,
      top: `${y}px`,
      backgroundColor: calculateHarmonyColor(storyboard.harmony_tie),
    }}
    onClick={() => onClick(storyboard)}
  >
    <div className={styles.nodeContent}>
      <h4>{storyboard.plot_point}</h4>
      <div
        className={styles.description}
        dangerouslySetInnerHTML={{ __html: storyboard.description }}
      />
      <div className={styles.nodeTimestamp}>
        {new Date(storyboard.created_at).toLocaleDateString()}
      </div>
      <div className={styles.nodeActions}>
        <button onClick={() => onEdit(storyboard)}>Edit</button>
        <button onClick={() => onDelete(storyboard.id)}>Delete</button>
      </div>
    </div>
    <div
      className={styles.harmonyIndicator}
      style={{
        backgroundColor: calculateHarmonyColor(storyboard.harmony_tie),
      }}
    />
  </div>
);

const TimelineConnection = ({ startX, startY, endX, endY, harmony }) => {
  const pathRef = useRef(null);

  useEffect(() => {
    if (pathRef.current) {
      const path = pathRef.current;
      const controlPointOffset = (endX - startX) * 0.5;
      const d = `M ${startX} ${startY}
                 C ${startX + controlPointOffset} ${startY},
                   ${endX - controlPointOffset} ${endY},
                   ${endX} ${endY}`;
      path.setAttribute('d', d);
    }
  }, [startX, startY, endX, endY]);

  return (
    <svg className={styles.connection}>
      <path
        ref={pathRef}
        stroke={calculateHarmonyColor(harmony)}
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
};

const TimelineVisualization = ({
  storyboards,
  selectedStoryboard,
  onNodeClick,
  onEdit,
  onDelete,
}) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      const observer = new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      });

      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, []);

  const calculateNodePositions = () => {
    const nodeSpacing = 200;
    const nodePositions = storyboards.map((storyboard, index) => {
      const x = index * nodeSpacing + 100;
      const y = 100 + Math.sin(index * 0.5) * 50; // Add some vertical variation
      return { x, y, storyboard };
    });

    return nodePositions;
  };

  const nodePositions = calculateNodePositions();

  return (
    <div ref={containerRef} className={styles.timelineVisualization}>
      <div
        className={styles.timelineContent}
        style={{ width: dimensions.width }}
      >
        {/* Draw connections first so they appear behind nodes */}
        {nodePositions.map((node, index) => {
          if (index === 0) return null;
          const prevNode = nodePositions[index - 1];
          return (
            <TimelineConnection
              key={`connection-${index}`}
              startX={prevNode.x}
              startY={prevNode.y}
              endX={node.x}
              endY={node.y}
              harmony={
                (node.storyboard.harmony_tie +
                  prevNode.storyboard.harmony_tie) /
                2
              }
            />
          );
        })}

        {/* Draw nodes */}
        {nodePositions.map(({ x, y, storyboard }) => (
          <TimelineNode
            key={storyboard.id}
            storyboard={storyboard}
            x={x}
            y={y}
            isSelected={selectedStoryboard?.id === storyboard.id}
            onClick={onNodeClick}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}

        {/* Time indicators */}
        <div className={styles.timeAxis}>
          {nodePositions.map(({ x, storyboard }) => (
            <div
              key={`time-${storyboard.id}`}
              className={styles.timeMarker}
              style={{ left: `${x}px` }}
            >
              {new Date(storyboard.created_at).toLocaleDateString()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

TimelineNode.propTypes = {
  storyboard: PropTypes.shape({
    id: PropTypes.number.isRequired,
    plot_point: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    harmony_tie: PropTypes.number.isRequired,
    created_at: PropTypes.string.isRequired,
  }).isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

TimelineConnection.propTypes = {
  startX: PropTypes.number.isRequired,
  startY: PropTypes.number.isRequired,
  endX: PropTypes.number.isRequired,
  endY: PropTypes.number.isRequired,
  harmony: PropTypes.number.isRequired,
};

TimelineVisualization.propTypes = {
  storyboards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      plot_point: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      harmony_tie: PropTypes.number.isRequired,
      created_at: PropTypes.string.isRequired,
    })
  ).isRequired,
  selectedStoryboard: PropTypes.object,
  onNodeClick: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default TimelineVisualization;
