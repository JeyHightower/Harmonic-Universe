import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { simulateScene } from '../store/physicsSlice';
import PhysicsEngine from './PhysicsEngine';

const mockStore = configureStore([thunk]);

describe('PhysicsEngine', () => {
  let store;
  const sceneId = 1;
  const mockPhysicsObjects = {
    1: {
      id: 1,
      scene_id: sceneId,
      name: 'Circle',
      object_type: 'circle',
      position: { x: 100, y: 100 },
      dimensions: { radius: 25 },
      is_static: false
    },
    2: {
      id: 2,
      scene_id: sceneId,
      name: 'Rectangle',
      object_type: 'rectangle',
      position: { x: 200, y: 200 },
      dimensions: { width: 50, height: 30 },
      is_static: true
    }
  };

  beforeEach(() => {
    store = mockStore({
      physics: {
        objects: mockPhysicsObjects,
        simulationInProgress: false
      }
    });
    store.dispatch = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders canvas and control buttons', () => {
    render(
      <Provider store={store}>
        <PhysicsEngine sceneId={sceneId} />
      </Provider>
    );

    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  it('starts simulation when play button is clicked', async () => {
    render(
      <Provider store={store}>
        <PhysicsEngine sceneId={sceneId} />
      </Provider>
    );

    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    // Wait for the first animation frame
    await act(async () => {
      jest.advanceTimersByTime(16); // Approximately one frame at 60fps
    });

    expect(store.dispatch).toHaveBeenCalledWith(expect.any(Function));
    expect(store.dispatch.mock.calls[0][0].toString())
      .toContain(simulateScene.toString());
  });

  it('stops simulation when pause button is clicked', async () => {
    render(
      <Provider store={store}>
        <PhysicsEngine sceneId={sceneId} />
      </Provider>
    );

    // Start simulation
    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    // Wait for the first animation frame
    await act(async () => {
      jest.advanceTimersByTime(16);
    });

    // Pause simulation
    const pauseButton = screen.getByRole('button', { name: /pause/i });
    fireEvent.click(pauseButton);

    // Wait another frame
    await act(async () => {
      jest.advanceTimersByTime(16);
    });

    // The dispatch count should remain the same after pausing
    const dispatchCount = store.dispatch.mock.calls.length;

    await act(async () => {
      jest.advanceTimersByTime(16);
    });

    expect(store.dispatch.mock.calls.length).toBe(dispatchCount);
  });

  it('disables controls during simulation in progress', () => {
    store = mockStore({
      physics: {
        objects: mockPhysicsObjects,
        simulationInProgress: true
      }
    });

    render(
      <Provider store={store}>
        <PhysicsEngine sceneId={sceneId} />
      </Provider>
    );

    expect(screen.getByRole('button', { name: /play/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /reset/i })).toBeDisabled();
  });

  it('renders physics objects on canvas', () => {
    const canvasContext = {
      scale: jest.fn(),
      translate: jest.fn(),
      clearRect: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      rect: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn()
    };

    const canvas = document.createElement('canvas');
    canvas.getContext = jest.fn(() => canvasContext);
    jest.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return canvas;
      return document.createElement(tag);
    });

    render(
      <Provider store={store}>
        <PhysicsEngine sceneId={sceneId} />
      </Provider>
    );

    // Start simulation to trigger rendering
    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    act(() => {
      jest.advanceTimersByTime(16);
    });

    // Verify that the canvas methods were called for both objects
    expect(canvasContext.arc).toHaveBeenCalled(); // For circle
    expect(canvasContext.rect).toHaveBeenCalled(); // For rectangle
  });
});
