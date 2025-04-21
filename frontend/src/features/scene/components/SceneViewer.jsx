import { Card, Descriptions, Skeleton, Tag } from 'antd';
import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';
import { formatDate } from '../../../utils/dateUtils';
import '../styles/SceneViewer.css';

const SceneViewer = React.memo(({ scene }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const formattedSceneType = useMemo(() => {
    return scene.sceneType ? scene.sceneType.charAt(0).toUpperCase() + scene.sceneType.slice(1) : 'Unknown';
  }, [scene.sceneType]);

  const sceneTypeColor = useMemo(() => {
    const colors = {
      action: 'blue',
      dialogue: 'green',
      exposition: 'orange',
      climax: 'red',
      resolution: 'purple'
    };
    return colors[scene.sceneType?.toLowerCase()] || 'default';
  }, [scene.sceneType]);

  const sceneDetails = useMemo(() => ({
    title: scene.title || 'Untitled Scene',
    description: scene.description || 'No description available',
    createdAt: formatDate(scene.createdAt),
    updatedAt: formatDate(scene.updatedAt),
    characters: scene.characters || [],
    location: scene.location || 'Unknown location',
    timeOfDay: scene.timeOfDay || 'Not specified',
    weather: scene.weather || 'Not specified'
  }), [scene]);

  return (
    <div className="scene-viewer">
      <Card className="scene-card-detail">
        <div className="scene-image-container">
          {scene.imageUrl && (
            <>
              {!imageLoaded && (
                <Skeleton.Image
                  active
                  style={{
                    width: '100%',
                    height: '300px',
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}
                />
              )}
              <img
                src={scene.imageUrl}
                alt={sceneDetails.title}
                className="scene-image"
                onLoad={() => setImageLoaded(true)}
                style={{ opacity: imageLoaded ? 1 : 0 }}
              />
            </>
          )}
        </div>

        <div className="scene-details">
          <Descriptions title={sceneDetails.title} bordered>
            <Descriptions.Item label="Scene Type">
              <Tag color={sceneTypeColor}>{formattedSceneType}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              {sceneDetails.description}
            </Descriptions.Item>
            <Descriptions.Item label="Location">
              {sceneDetails.location}
            </Descriptions.Item>
            <Descriptions.Item label="Time of Day">
              {sceneDetails.timeOfDay}
            </Descriptions.Item>
            <Descriptions.Item label="Weather">
              {sceneDetails.weather}
            </Descriptions.Item>
            <Descriptions.Item label="Characters">
              {sceneDetails.characters.map(character => (
                <Tag key={character.id}>{character.name}</Tag>
              ))}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {sceneDetails.createdAt}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {sceneDetails.updatedAt}
            </Descriptions.Item>
          </Descriptions>
        </div>
      </Card>
    </div>
  );
});

SceneViewer.propTypes = {
  scene: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    sceneType: PropTypes.string,
    location: PropTypes.string,
    timeOfDay: PropTypes.string,
    weather: PropTypes.string,
    imageUrl: PropTypes.string,
    characters: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string
      })
    ),
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string
  }).isRequired
};

SceneViewer.displayName = 'SceneViewer';

export default SceneViewer;
