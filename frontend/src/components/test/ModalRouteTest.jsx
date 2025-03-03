import React from 'react';
import { Link } from 'react-router-dom';
import { API_MODAL_ROUTES } from '../../routes';
import Button from '../common/Button';

/**
 * Test component for verifying modal routes and deep linking functionality.
 * This component displays links to all available modal routes for testing.
 */
const ModalRouteTest = () => {
  // Sample IDs for testing (replace with actual IDs from your database)
  const mockIds = {
    universeId: '00000000-0000-0000-0000-000000000001',
    sceneId: '00000000-0000-0000-0000-000000000002',
    physicsObjectId: '00000000-0000-0000-0000-000000000003',
    physicsParametersId: '00000000-0000-0000-0000-000000000004',
    userId: '00000000-0000-0000-0000-000000000005',
    audioId: '00000000-0000-0000-0000-000000000006',
    visualizationId: '00000000-0000-0000-0000-000000000007',
    physicsConstraintId: '00000000-0000-0000-0000-000000000008',
  };

  // Replace placeholders in API routes with test IDs
  const getTestRoute = route => {
    let testRoute = route;

    if (testRoute.includes(':id')) {
      testRoute = testRoute.replace(':id', mockIds.universeId);
    }

    if (testRoute.includes(':universeId')) {
      testRoute = testRoute.replace(':universeId', mockIds.universeId);
    }

    if (testRoute.includes(':sceneId')) {
      testRoute = testRoute.replace(':sceneId', mockIds.sceneId);
    }

    return testRoute;
  };

  // Get a description for a route
  const getRouteDescription = (routeKey, route) => {
    if (routeKey.includes('CREATE')) {
      return `Create new ${routeKey.split('_')[1].toLowerCase()}`;
    } else if (routeKey.includes('EDIT')) {
      return `Edit existing ${routeKey.split('_')[1].toLowerCase()}`;
    } else if (routeKey.includes('DELETE')) {
      return `Delete ${routeKey.split('_')[1].toLowerCase()}`;
    } else if (routeKey === 'USER_PROFILE') {
      return 'View user profile';
    } else if (routeKey === 'GENERATE_AUDIO') {
      return 'Generate audio for a scene';
    } else if (routeKey === 'AUDIO_DETAILS') {
      return 'View audio details';
    } else {
      return route;
    }
  };

  // Group routes by type for better organization
  const groupedRoutes = {
    Universe: Object.entries(API_MODAL_ROUTES).filter(([key]) =>
      key.includes('UNIVERSE')
    ),
    Scene: Object.entries(API_MODAL_ROUTES).filter(([key]) =>
      key.includes('SCENE')
    ),
    'Physics Objects': Object.entries(API_MODAL_ROUTES).filter(([key]) =>
      key.includes('PHYSICS_OBJECT')
    ),
    'Physics Parameters': Object.entries(API_MODAL_ROUTES).filter(([key]) =>
      key.includes('PHYSICS_PARAMETERS')
    ),
    'Physics Constraints': Object.entries(API_MODAL_ROUTES).filter(([key]) =>
      key.includes('PHYSICS_CONSTRAINT')
    ),
    Audio: Object.entries(API_MODAL_ROUTES).filter(
      ([key]) => key.includes('AUDIO') || key.includes('GENERATE_AUDIO')
    ),
    Visualization: Object.entries(API_MODAL_ROUTES).filter(([key]) =>
      key.includes('VISUALIZATION')
    ),
    User: Object.entries(API_MODAL_ROUTES).filter(([key]) =>
      key.includes('USER')
    ),
  };

  return (
    <div className="modal-route-test">
      <div className="container">
        <h1>Modal Route Test</h1>
        <p>
          Click on the links below to test the modal routes and deep linking
          functionality.
        </p>

        {Object.entries(groupedRoutes).map(([groupName, routes]) => (
          <div key={groupName} className="route-group">
            <h2>{groupName} Routes</h2>
            <div className="button-grid">
              {routes.map(([routeKey, route]) => (
                <Link key={routeKey} to={getTestRoute(route)}>
                  <Button variant="primary" className="route-button">
                    {getRouteDescription(routeKey, route)}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="instructions">
          <h3>Testing Instructions</h3>
          <ol>
            <li>Click on a button to open the corresponding modal.</li>
            <li>
              Verify that the modal opens correctly with the expected title and
              content.
            </li>
            <li>Test the form functionality if it's a form modal.</li>
            <li>Close the modal and verify that you return to this page.</li>
            <li>
              Check browser history navigation (back/forward) to ensure deep
              linking works correctly.
            </li>
          </ol>
        </div>
      </div>

      <style jsx>{`
        .modal-route-test {
          padding: 2rem;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .route-group {
          margin-bottom: 2rem;
          padding: 1rem;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          background: #f9f9f9;
        }
        .button-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
          margin: 1rem 0;
        }
        .route-button {
          width: 100%;
          text-align: left;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .instructions {
          margin-top: 2rem;
          padding: 1rem;
          border: 1px solid #ffd700;
          border-radius: 4px;
          background: #ffffc0;
        }
      `}</style>
    </div>
  );
};

export default ModalRouteTest;
