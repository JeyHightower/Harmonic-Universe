import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import PhysicsPanel from '../PhysicsPanel';

const mockStore = configureStore([thunk]);

describe('PhysicsPanel', () => {
  const sceneId = 1;
  const mockPhysicsObjects = {
    1: {
      id: 1,
      scene_id: sceneId,
      name: 'Test Object',
      object_type: 'circle',
      mass: 1.0
    },
    2: {
      id: 2,
      scene_id: sceneId,
      name: 'Another Object',
      object_type: 'rectangle',
      mass: 2.0
    },
    3: {
      id: 3,
      scene_id: 999,
      name: 'Other Scene Object',
      object_type: 'circle',
      mass: 1.0
    }
  };

  const mockPhysicsConstraints = {
    1: {
      id: 1,
      object_a_id: 1,
      object_b_id: 2,
      constraint_type: 'spring',
      stiffness: 1.0,
      damping: 0.7
    }
  };

  let store;

  beforeEach(() => {
    store = mockStore({
      physics: {
        objects: mockPhysicsObjects,
        constraints: mockPhysicsConstraints,
        loading: false,
        error: null
      }
    });
  });

  it('renders physics engine and object/constraint lists', () => {
    render(
      <Provider store={store}>
        <PhysicsPanel sceneId={sceneId} />
      </Provider>
    );

    // Check for main sections
    expect(screen.getByText('Physics Objects')).toBeInTheDocument();
    expect(screen.getByText('Physics Constraints')).toBeInTheDocument();

    // Check for add buttons
    expect(screen.getByText('Add Object')).toBeInTheDocument();
    expect(screen.getByText('Add Constraint')).toBeInTheDocument();

    // Check for objects from the correct scene
    expect(screen.getByText('Test Object')).toBeInTheDocument();
    expect(screen.getByText('Another Object')).toBeInTheDocument();
    expect(screen.queryByText('Other Scene Object')).not.toBeInTheDocument();

    // Check for constraints
    expect(screen.getByText('spring')).toBeInTheDocument();
    expect(screen.getByText('Stiffness: 1 - Damping: 0.7')).toBeInTheDocument();
  });

  it('opens object editor when Add Object is clicked', () => {
    render(
      <Provider store={store}>
        <PhysicsPanel sceneId={sceneId} />
      </Provider>
    );

    fireEvent.click(screen.getByText('Add Object'));
    expect(screen.getByText('Create Physics Object')).toBeInTheDocument();
  });

  it('opens object editor with data when existing object is clicked', () => {
    render(
      <Provider store={store}>
        <PhysicsPanel sceneId={sceneId} />
      </Provider>
    );

    fireEvent.click(screen.getByText('Test Object'));
    expect(screen.getByText('Edit Physics Object')).toBeInTheDocument();
  });

  it('opens constraint editor when Add Constraint is clicked', () => {
    render(
      <Provider store={store}>
        <PhysicsPanel sceneId={sceneId} />
      </Provider>
    );

    fireEvent.click(screen.getByText('Add Constraint'));
    expect(screen.getByText('Create Physics Constraint')).toBeInTheDocument();
  });

  it('opens constraint editor with data when existing constraint is clicked', () => {
    render(
      <Provider store={store}>
        <PhysicsPanel sceneId={sceneId} />
      </Provider>
    );

    fireEvent.click(screen.getByText('spring'));
    expect(screen.getByText('Edit Physics Constraint')).toBeInTheDocument();
  });

  it('disables Add Constraint button when there are less than 2 objects', () => {
    store = mockStore({
      physics: {
        objects: { 1: mockPhysicsObjects[1] },
        constraints: {},
        loading: false,
        error: null
      }
    });

    render(
      <Provider store={store}>
        <PhysicsPanel sceneId={sceneId} />
      </Provider>
    );

    expect(screen.getByText('Add Constraint')).toBeDisabled();
  });

  it('filters objects and constraints by scene', () => {
    render(
      <Provider store={store}>
        <PhysicsPanel sceneId={999} />
      </Provider>
    );

    // Should only show objects from scene 999
    expect(screen.queryByText('Test Object')).not.toBeInTheDocument();
    expect(screen.queryByText('Another Object')).not.toBeInTheDocument();
    expect(screen.getByText('Other Scene Object')).toBeInTheDocument();

    // Should not show any constraints since objects are in different scenes
    expect(screen.queryByText('spring')).not.toBeInTheDocument();
  });
});
