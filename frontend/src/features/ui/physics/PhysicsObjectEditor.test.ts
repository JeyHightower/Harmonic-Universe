import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
    createPhysicsObject,
    deletePhysicsObject,
    updatePhysicsObject
} from '../store/physicsSlice';
import PhysicsObjectEditor from './PhysicsObjectEditor';

const mockStore = configureStore([thunk]);

describe('PhysicsObjectEditor', () => {
  let store;
  const sceneId = 1;
  const mockInitialData = {
    name: 'Test Object',
    object_type: 'circle',
    mass: 1.0,
    position: { x: 100, y: 100 },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    angle: 0,
    angular_velocity: 0,
    dimensions: { radius: 25 },
    restitution: 0.5,
    friction: 0.3,
    is_static: false,
    is_sensor: false,
    collision_filter: { category: 1, mask: 0xFFFF }
  };

  beforeEach(() => {
    store = mockStore({
      physics: {
        loading: false,
        error: null
      }
    });
    store.dispatch = jest.fn(() => Promise.resolve());
  });

  it('renders create form with empty values', () => {
    render(
      <Provider store={store}>
        <PhysicsObjectEditor
          open={true}
          onClose={() => {}}
          sceneId={sceneId}
        />
      </Provider>
    );

    expect(screen.getByLabelText(/name/i)).toHaveValue('');
    expect(screen.getByLabelText(/object type/i)).toHaveValue('circle');
    expect(screen.getByLabelText(/mass/i)).toHaveValue(1);
  });

  it('renders edit form with initial values', () => {
    render(
      <Provider store={store}>
        <PhysicsObjectEditor
          open={true}
          onClose={() => {}}
          sceneId={sceneId}
          objectId={1}
          initialData={mockInitialData}
        />
      </Provider>
    );

    expect(screen.getByLabelText(/name/i)).toHaveValue('Test Object');
    expect(screen.getByLabelText(/object type/i)).toHaveValue('circle');
    expect(screen.getByLabelText(/mass/i)).toHaveValue(1);
  });

  it('creates new physics object', async () => {
    const onClose = jest.fn();

    render(
      <Provider store={store}>
        <PhysicsObjectEditor
          open={true}
          onClose={onClose}
          sceneId={sceneId}
        />
      </Provider>
    );

    // Fill in form
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'New Object' }
    });

    fireEvent.change(screen.getByLabelText(/mass/i), {
      target: { value: '2.5' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    const dispatchedAction = store.dispatch.mock.calls[0][0];
    expect(dispatchedAction.toString()).toContain(createPhysicsObject.toString());
    expect(onClose).toHaveBeenCalled();
  });

  it('updates existing physics object', async () => {
    const onClose = jest.fn();
    const objectId = 1;

    render(
      <Provider store={store}>
        <PhysicsObjectEditor
          open={true}
          onClose={onClose}
          sceneId={sceneId}
          objectId={objectId}
          initialData={mockInitialData}
        />
      </Provider>
    );

    // Modify form
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Updated Object' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    const dispatchedAction = store.dispatch.mock.calls[0][0];
    expect(dispatchedAction.toString()).toContain(updatePhysicsObject.toString());
    expect(onClose).toHaveBeenCalled();
  });

  it('deletes physics object', async () => {
    const onClose = jest.fn();
    const objectId = 1;

    render(
      <Provider store={store}>
        <PhysicsObjectEditor
          open={true}
          onClose={onClose}
          sceneId={sceneId}
          objectId={objectId}
          initialData={mockInitialData}
        />
      </Provider>
    );

    // Click delete button
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    const dispatchedAction = store.dispatch.mock.calls[0][0];
    expect(dispatchedAction.toString()).toContain(deletePhysicsObject.toString());
    expect(onClose).toHaveBeenCalled();
  });

  it('handles form validation', async () => {
    render(
      <Provider store={store}>
        <PhysicsObjectEditor
          open={true}
          onClose={() => {}}
          sceneId={sceneId}
        />
      </Provider>
    );

    // Try to submit with invalid mass
    fireEvent.change(screen.getByLabelText(/mass/i), {
      target: { value: '-1' }
    });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    // Verify that dispatch wasn't called
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('disables form during loading state', () => {
    store = mockStore({
      physics: {
        loading: true,
        error: null
      }
    });

    render(
      <Provider store={store}>
        <PhysicsObjectEditor
          open={true}
          onClose={() => {}}
          sceneId={sceneId}
        />
      </Provider>
    );

    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });

  it('displays error message', () => {
    store = mockStore({
      physics: {
        loading: false,
        error: 'Failed to save object'
      }
    });

    render(
      <Provider store={store}>
        <PhysicsObjectEditor
          open={true}
          onClose={() => {}}
          sceneId={sceneId}
        />
      </Provider>
    );

    expect(screen.getByText('Failed to save object')).toBeInTheDocument();
  });

  it('updates dimensions based on object type', () => {
    render(
      <Provider store={store}>
        <PhysicsObjectEditor
          open={true}
          onClose={() => {}}
          sceneId={sceneId}
        />
      </Provider>
    );

    // Initially shows radius for circle
    expect(screen.getByLabelText(/radius/i)).toBeInTheDocument();

    // Change to rectangle
    fireEvent.mouseDown(screen.getByLabelText(/object type/i));
    fireEvent.click(screen.getByText(/rectangle/i));

    // Now shows width and height
    expect(screen.getByLabelText(/width/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/height/i)).toBeInTheDocument();
  });

  it('toggles static object properties', () => {
    render(
      <Provider store={store}>
        <PhysicsObjectEditor
          open={true}
          onClose={() => {}}
          sceneId={sceneId}
        />
      </Provider>
    );

    const staticSwitch = screen.getByRole('checkbox', { name: /static object/i });

    // Initially velocity fields are enabled
    expect(screen.getByLabelText('X', { exact: false })).not.toBeDisabled();
    expect(screen.getByLabelText('Y', { exact: false })).not.toBeDisabled();

    // Make object static
    fireEvent.click(staticSwitch);

    // Velocity fields should be disabled
    expect(screen.getByLabelText('X', { exact: false })).toBeDisabled();
    expect(screen.getByLabelText('Y', { exact: false })).toBeDisabled();
  });
});
