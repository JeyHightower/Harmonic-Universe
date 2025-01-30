import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
    createPhysicsConstraint,
    deletePhysicsConstraint,
    updatePhysicsConstraint
} from '../store/physicsSlice';
import PhysicsConstraintEditor from './PhysicsConstraintEditor';

const mockStore = configureStore([thunk]);

describe('PhysicsConstraintEditor', () => {
  let store;
  const sceneId = 1;
  const mockPhysicsObjects = {
    1: { id: 1, scene_id: sceneId, name: 'Object A' },
    2: { id: 2, scene_id: sceneId, name: 'Object B' },
    3: { id: 3, scene_id: 999, name: 'Other Scene Object' }
  };
  const mockInitialData = {
    object_a_id: 1,
    object_b_id: 2,
    constraint_type: 'distance',
    parameters: {},
    stiffness: 1.0,
    damping: 0.7,
    length: 100,
    anchor_a: { x: 0, y: 0 },
    anchor_b: { x: 0, y: 0 },
    min_limit: null,
    max_limit: null
  };

  beforeEach(() => {
    store = mockStore({
      physics: {
        objects: mockPhysicsObjects,
        loading: false,
        error: null
      }
    });
    store.dispatch = jest.fn(() => Promise.resolve());
  });

  it('renders create form with empty values', () => {
    render(
      <Provider store={store}>
        <PhysicsConstraintEditor
          open={true}
          onClose={() => {}}
          sceneId={sceneId}
        />
      </Provider>
    );

    expect(screen.getByLabelText(/object a/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/object b/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/constraint type/i)).toHaveValue('distance');
  });

  it('renders edit form with initial values', () => {
    render(
      <Provider store={store}>
        <PhysicsConstraintEditor
          open={true}
          onClose={() => {}}
          sceneId={sceneId}
          constraintId={1}
          initialData={mockInitialData}
        />
      </Provider>
    );

    expect(screen.getByLabelText(/object a/i)).toHaveValue('1');
    expect(screen.getByLabelText(/object b/i)).toHaveValue('2');
    expect(screen.getByLabelText(/constraint type/i)).toHaveValue('distance');
    expect(screen.getByLabelText(/stiffness/i)).toHaveValue(1.0);
    expect(screen.getByLabelText(/damping/i)).toHaveValue(0.7);
  });

  it('filters objects by scene', () => {
    render(
      <Provider store={store}>
        <PhysicsConstraintEditor
          open={true}
          onClose={() => {}}
          sceneId={sceneId}
        />
      </Provider>
    );

    // Open object A dropdown
    fireEvent.mouseDown(screen.getByLabelText(/object a/i));

    // Should show objects from the current scene
    expect(screen.getByText('Object A')).toBeInTheDocument();
    expect(screen.getByText('Object B')).toBeInTheDocument();
    // Should not show objects from other scenes
    expect(screen.queryByText('Other Scene Object')).not.toBeInTheDocument();
  });

  it('creates new physics constraint', async () => {
    const onClose = jest.fn();

    render(
      <Provider store={store}>
        <PhysicsConstraintEditor
          open={true}
          onClose={onClose}
          sceneId={sceneId}
        />
      </Provider>
    );

    // Select objects
    fireEvent.mouseDown(screen.getByLabelText(/object a/i));
    fireEvent.click(screen.getByText('Object A'));
    fireEvent.mouseDown(screen.getByLabelText(/object b/i));
    fireEvent.click(screen.getByText('Object B'));

    // Set constraint properties
    fireEvent.change(screen.getByLabelText(/stiffness/i), {
      target: { value: '2.0' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    const dispatchedAction = store.dispatch.mock.calls[0][0];
    expect(dispatchedAction.toString()).toContain(createPhysicsConstraint.toString());
    expect(onClose).toHaveBeenCalled();
  });

  it('updates existing physics constraint', async () => {
    const onClose = jest.fn();
    const constraintId = 1;

    render(
      <Provider store={store}>
        <PhysicsConstraintEditor
          open={true}
          onClose={onClose}
          sceneId={sceneId}
          constraintId={constraintId}
          initialData={mockInitialData}
        />
      </Provider>
    );

    // Modify constraint properties
    fireEvent.change(screen.getByLabelText(/stiffness/i), {
      target: { value: '3.0' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    const dispatchedAction = store.dispatch.mock.calls[0][0];
    expect(dispatchedAction.toString()).toContain(updatePhysicsConstraint.toString());
    expect(onClose).toHaveBeenCalled();
  });

  it('deletes physics constraint', async () => {
    const onClose = jest.fn();
    const constraintId = 1;

    render(
      <Provider store={store}>
        <PhysicsConstraintEditor
          open={true}
          onClose={onClose}
          sceneId={sceneId}
          constraintId={constraintId}
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
    expect(dispatchedAction.toString()).toContain(deletePhysicsConstraint.toString());
    expect(onClose).toHaveBeenCalled();
  });

  it('shows/hides fields based on constraint type', () => {
    render(
      <Provider store={store}>
        <PhysicsConstraintEditor
          open={true}
          onClose={() => {}}
          sceneId={sceneId}
        />
      </Provider>
    );

    // Initially shows length for distance constraint
    expect(screen.getByLabelText(/length/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/min limit/i)).not.toBeInTheDocument();

    // Change to revolute constraint
    fireEvent.mouseDown(screen.getByLabelText(/constraint type/i));
    fireEvent.click(screen.getByText(/revolute/i));

    // Now shows limits
    expect(screen.queryByLabelText(/length/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/min limit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max limit/i)).toBeInTheDocument();
  });

  it('handles form validation', async () => {
    render(
      <Provider store={store}>
        <PhysicsConstraintEditor
          open={true}
          onClose={() => {}}
          sceneId={sceneId}
        />
      </Provider>
    );

    // Try to submit without selecting objects
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    // Verify that dispatch wasn't called
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('disables form during loading state', () => {
    store = mockStore({
      physics: {
        objects: mockPhysicsObjects,
        loading: true,
        error: null
      }
    });

    render(
      <Provider store={store}>
        <PhysicsConstraintEditor
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
        objects: mockPhysicsObjects,
        loading: false,
        error: 'Failed to save constraint'
      }
    });

    render(
      <Provider store={store}>
        <PhysicsConstraintEditor
          open={true}
          onClose={() => {}}
          sceneId={sceneId}
        />
      </Provider>
    );

    expect(screen.getByText('Failed to save constraint')).toBeInTheDocument();
  });
});
