import { EditOutlined, HomeOutlined, ReadOutlined, WarningOutlined } from '@ant-design/icons';
import { Alert, Breadcrumb, Button, Card, message, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../../services/api.adapter.mjs';
import '../styles/SceneEditPage.css';
import SceneForm from './SceneForm';

// Destructure window.setTimeout to fix linter error
const { setTimeout } = window;

const { Title } = Typography;

/**
 * SceneEditPage component for editing scenes on a dedicated page
 * This replaces the modal approach with a full page edit experience
 */
const SceneEditPage = () => {
  const { universeId, sceneId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scene, setScene] = useState(null);
  const [universeName, setUniverseName] = useState('');
  const [error, setError] = useState(null);

  console.log('SceneEditPage - Component rendering with params:', {
    universeId,
    sceneId,
  });

  // Fetch the scene data when the component mounts
  useEffect(() => {
    const fetchSceneData = async () => {
      try {
        console.log(`SceneEditPage - Fetching scene ${sceneId} from universe ${universeId}`);
        setLoading(true);
        setError(null);

        // Call the getSceneById directly to ensure we get the complete scene data
        const response = await apiClient.scenes.getSceneById(sceneId);

        console.log('SceneEditPage - Raw API response:', response);

        // Ensure we extract the scene data properly
        let sceneData;
        if (response.data?.scene) {
          sceneData = response.data.scene;
        } else if (response.data) {
          sceneData = response.data;
        } else {
          throw new Error('Invalid response format - missing scene data');
        }

        console.log('SceneEditPage - Scene data fetched:', sceneData);

        // Transform fields as needed for the form
        const transformedSceneData = {
          ...sceneData,
          // Ensure camelCase for form consistency where needed
          timeOfDay: sceneData.time_of_day || sceneData.timeOfDay,
          characterIds: sceneData.character_ids || sceneData.characterIds || [],
          dateOfScene: sceneData.date_of_scene || sceneData.dateOfScene,
          // Add any other transformations needed
        };

        setScene(transformedSceneData);

        // Get universe name if available
        if (sceneData?.universe?.name) {
          setUniverseName(sceneData.universe.name);
        } else if (universeId) {
          try {
            const universeResponse = await apiClient.universes.getUniverseById(universeId);
            const universeData = universeResponse.data?.universe || universeResponse.data;
            if (universeData?.name) {
              setUniverseName(universeData.name);
            }
          } catch (error) {
            console.error('SceneEditPage - Error fetching universe:', error);
          }
        }
      } catch (error) {
        console.error('SceneEditPage - Error fetching scene:', error);
        setError('Failed to load scene data. Please refresh the page and try again.');
        message.error('Failed to load scene. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (sceneId) {
      fetchSceneData();
    } else {
      setLoading(false);
      setError('No scene ID provided. Cannot edit without a scene ID.');
    }
  }, [sceneId, universeId]);

  // Handle form submission (save changes)
  const handleSubmit = async (formattedValues) => {
    try {
      console.log('SceneEditPage - Saving scene changes:', formattedValues);
      setLoading(true);
      setError(null);

      // Make sure we have a universe_id
      const targetUniverseId = universeId || (scene && scene.universe_id);
      if (!formattedValues.universe_id && targetUniverseId) {
        console.log('SceneEditPage - Adding universeId to scene data:', targetUniverseId);
        formattedValues.universe_id = targetUniverseId;
      }

      // Convert form field names to snake_case as needed by the API
      if (formattedValues.timeOfDay && !formattedValues.time_of_day) {
        formattedValues.time_of_day = formattedValues.timeOfDay;
        delete formattedValues.timeOfDay;
      }

      if (formattedValues.characterIds && !formattedValues.character_ids) {
        formattedValues.character_ids = formattedValues.characterIds;
        delete formattedValues.characterIds;
      }

      if (formattedValues.dateOfScene && !formattedValues.date_of_scene) {
        formattedValues.date_of_scene = formattedValues.dateOfScene;
        delete formattedValues.dateOfScene;
      }

      // Log what we're about to send to the API
      console.log('SceneEditPage - Sending to API:', {
        sceneId,
        updatedData: formattedValues,
      });

      const response = await apiClient.scenes.updateScene(sceneId, formattedValues);
      console.log('SceneEditPage - Update response:', response);

      let result;
      if (response.data?.scene) {
        result = response.data.scene;
      } else if (response.data) {
        result = response.data;
      } else {
        console.warn('SceneEditPage - Unexpected API response format:', response);
        result = response;
      }

      console.log('SceneEditPage - Scene updated successfully:', result);
      message.success('Scene updated successfully!');

      // Get the universe_id to navigate to, preferring the response data
      const navigateUniverseId =
        result.universe_id || targetUniverseId || (result.universe && result.universe.id);

      // Delay navigation slightly to allow success message to be seen
      setTimeout(() => {
        // Navigate back to the scene details page
        if (navigateUniverseId) {
          navigate(`/universes/${navigateUniverseId}/scenes/${sceneId}`);
        } else {
          // Fallback to dashboard if we don't have a universe_id
          console.warn('No universe_id found, navigating to dashboard');
          navigate('/dashboard');
        }
      }, 500);

      return result; // Return the result to the SceneForm
    } catch (error) {
      console.error('SceneEditPage - Error updating scene:', error);
      console.error('SceneEditPage - Error details:', error.response?.data || error.message);
      setError(
        `Failed to update scene: ${
          error.response?.data?.error || error.message || 'An unknown error occurred'
        }`
      );
      message.error('Failed to update scene. Please try again.');
      throw error; // Re-throw to let SceneForm handle the error
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    console.log('SceneEditPage - Edit canceled');
    // Use scene.universe_id as a fallback if universeId is undefined
    const targetUniverseId = universeId || (scene && scene.universe_id);
    // Navigate back to the scene details page
    if (targetUniverseId) {
      navigate(`/universes/${targetUniverseId}/scenes/${sceneId}`);
    } else {
      // Fallback to dashboard if we don't have a universe_id
      console.warn('No universe_id found, navigating to dashboard');
      navigate('/dashboard');
    }
  };

  return (
    <div className="scene-edit-page">
      <Breadcrumb className="scene-breadcrumbs">
        <Breadcrumb.Item href="/">
          <HomeOutlined /> Home
        </Breadcrumb.Item>
        {scene && (
          <>
            <Breadcrumb.Item href={`/universes/${scene.universe_id || universeId}`}>
              {universeName || `Universe ${scene.universe_id || universeId}`}
            </Breadcrumb.Item>
            <Breadcrumb.Item
              href={`/universes/${scene.universe_id || universeId}/scenes/${sceneId}`}
            >
              <ReadOutlined /> {scene.name || 'Scene Details'}
            </Breadcrumb.Item>
          </>
        )}
        {!scene && universeId && (
          <>
            <Breadcrumb.Item href={`/universes/${universeId}`}>
              {universeName || `Universe ${universeId}`}
            </Breadcrumb.Item>
            <Breadcrumb.Item href={`/universes/${universeId}/scenes/${sceneId}`}>
              <ReadOutlined /> {'Scene Details'}
            </Breadcrumb.Item>
          </>
        )}
        <Breadcrumb.Item>
          <EditOutlined /> Edit Scene
        </Breadcrumb.Item>
      </Breadcrumb>

      <div className="scene-edit-header">
        <Title level={2}>{scene?.name ? `Edit "${scene.name}"` : 'Edit Scene'}</Title>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: '24px' }}
          closable
        />
      )}

      {loading && !scene ? (
        <Card className="loading-card">
          <div className="loading-container">
            <Spin size="large" />
            <p>Loading scene data...</p>
          </div>
        </Card>
      ) : scene ? (
        <SceneForm
          universeId={universeId || scene.universe_id}
          sceneId={sceneId}
          initialData={scene}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      ) : (
        <Card className="error-card">
          <Alert
            message="No Scene Data"
            description="Could not load scene data. Please go back and try again."
            type="warning"
            showIcon
          />
          <Button type="primary" onClick={handleCancel} style={{ marginTop: '16px' }}>
            Go Back
          </Button>
        </Card>
      )}
    </div>
  );
};

export default SceneEditPage;
