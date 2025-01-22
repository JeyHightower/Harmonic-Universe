import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PhysicsProvider } from '../PhysicsContext';
import PhysicsControls from '../PhysicsControls';
import PhysicsSimulation from '../PhysicsSimulation';

// Mock Matter.js
const mockMatter = {
  Engine: {
    create: vi.fn(() => ({
      world: {
        gravity: { x: 0, y: 1 },
        bodies: [],
      },
      timing: { timeScale: 1 },
    })),
    update: vi.fn(),
    clear: vi.fn(),
  },
  World: {
    add: vi.fn(),
    remove: vi.fn(),
  },
  Bodies: {
    rectangle: vi.fn((x, y, width, height, options) => ({
      position: { x, y },
      velocity: { x: 0, y: 0 },
      force: { x: 0, y: 0 },
      mass: options?.mass || 1,
      restitution: options?.restitution || 0.6,
      friction: options?.friction || 0.1,
    })),
    circle: vi.fn((x, y, radius, options) => ({
      position: { x, y },
      velocity: { x: 0, y: 0 },
      force: { x: 0, y: 0 },
      mass: options?.mass || 1,
      restitution: options?.restitution || 0.6,
      friction: options?.friction || 0.1,
    })),
  },
  Render: {
    create: vi.fn(() => ({
      canvas: document.createElement('canvas'),
      context: {},
      options: {},
    })),
    run: vi.fn(),
    stop: vi.fn(),
  },
  Runner: {
    create: vi.fn(),
    run: vi.fn(),
    stop: vi.fn(),
  },
};

vi.mock('matter-js', () => mockMatter);

describe('Physics Engine', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        physics: (
          state = {
            isRunning: false,
            gravity: { x: 0, y: 1 },
            timeScale: 1,
            bodies: [],
            error: null,
          },
          action
        ) => state,
      },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = component => {
    return render(
      <Provider store={store}>
        <PhysicsProvider>{component}</PhysicsProvider>
      </Provider>
    );
  };

  describe('PhysicsControls Component', () => {
    it('renders physics controls correctly', () => {
      renderWithProviders(<PhysicsControls />);

      expect(screen.getByTestId('start-button')).toBeInTheDocument();
      expect(screen.getByTestId('gravity-slider')).toBeInTheDocument();
      expect(screen.getByTestId('time-scale-slider')).toBeInTheDocument();
    });

    it('toggles simulation state', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PhysicsControls />);

      const startButton = screen.getByTestId('start-button');
      await user.click(startButton);
      expect(startButton).toHaveAttribute('aria-label', 'Stop Simulation');

      await user.click(startButton);
      expect(startButton).toHaveAttribute('aria-label', 'Start Simulation');
    });

    it('adjusts gravity', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PhysicsControls />);

      const gravitySlider = screen.getByTestId('gravity-slider');
      await user.type(gravitySlider, '2');
      expect(gravitySlider).toHaveValue('2');
    });

    it('adjusts time scale', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PhysicsControls />);

      const timeScaleSlider = screen.getByTestId('time-scale-slider');
      await user.type(timeScaleSlider, '1.5');
      expect(timeScaleSlider).toHaveValue('1.5');
    });
  });

  describe('PhysicsSimulation Component', () => {
    it('renders simulation canvas', () => {
      renderWithProviders(<PhysicsSimulation />);
      expect(screen.getByTestId('physics-canvas')).toBeInTheDocument();
    });

    it('initializes Matter.js engine', () => {
      renderWithProviders(<PhysicsSimulation />);
      expect(mockMatter.Engine.create).toHaveBeenCalled();
      expect(mockMatter.Render.create).toHaveBeenCalled();
    });

    it('adds bodies to the world', async () => {
      renderWithProviders(<PhysicsSimulation />);

      const rectangle = mockMatter.Bodies.rectangle(100, 100, 50, 50, {});
      mockMatter.World.add(mockMatter.Engine.create().world, rectangle);

      await waitFor(() => {
        expect(mockMatter.World.add).toHaveBeenCalled();
      });
    });

    it('updates simulation when running', async () => {
      renderWithProviders(<PhysicsSimulation />);

      const user = userEvent.setup();
      await user.click(screen.getByTestId('start-button'));

      await waitFor(() => {
        expect(mockMatter.Engine.update).toHaveBeenCalled();
      });
    });

    it('stops simulation when component unmounts', () => {
      const { unmount } = renderWithProviders(<PhysicsSimulation />);
      unmount();

      expect(mockMatter.Runner.stop).toHaveBeenCalled();
      expect(mockMatter.Render.stop).toHaveBeenCalled();
    });
  });

  describe('Physics Context Integration', () => {
    it('initializes physics engine when needed', async () => {
      renderWithProviders(<PhysicsControls />);
      const startButton = screen.getByTestId('start-button');
      await userEvent.click(startButton);

      expect(mockMatter.Engine.create).toHaveBeenCalled();
    });

    it('updates physics parameters', async () => {
      const engine = mockMatter.Engine.create();
      renderWithProviders(<PhysicsControls engine={engine} />);

      const user = userEvent.setup();
      await user.type(screen.getByTestId('gravity-slider'), '2');

      expect(engine.world.gravity.y).toBe(2);
    });

    it('handles body creation and removal', async () => {
      const engine = mockMatter.Engine.create();
      renderWithProviders(<PhysicsSimulation engine={engine} />);

      const rectangle = mockMatter.Bodies.rectangle(100, 100, 50, 50, {});
      mockMatter.World.add(engine.world, rectangle);
      expect(mockMatter.World.add).toHaveBeenCalledWith(
        engine.world,
        rectangle
      );

      mockMatter.World.remove(engine.world, rectangle);
      expect(mockMatter.World.remove).toHaveBeenCalledWith(
        engine.world,
        rectangle
      );
    });
  });

  describe('Error Handling', () => {
    it('displays error message when physics engine fails to initialize', async () => {
      mockMatter.Engine.create.mockImplementationOnce(() => {
        throw new Error('Physics initialization failed');
      });

      renderWithProviders(<PhysicsControls />);
      await userEvent.click(screen.getByTestId('start-button'));

      expect(
        screen.getByText(/physics initialization failed/i)
      ).toBeInTheDocument();
    });

    it('handles unsupported browser error', () => {
      const originalCanvas = global.HTMLCanvasElement;
      global.HTMLCanvasElement = undefined;

      renderWithProviders(<PhysicsSimulation />);
      expect(
        screen.getByText(/canvas is not supported in this browser/i)
      ).toBeInTheDocument();

      global.HTMLCanvasElement = originalCanvas;
    });

    it('recovers from physics engine errors', async () => {
      const engine = mockMatter.Engine.create();
      mockMatter.Engine.update
        .mockImplementationOnce(() => {
          throw new Error('Update failed');
        })
        .mockImplementationOnce(() => {});

      renderWithProviders(<PhysicsControls engine={engine} />);

      await userEvent.click(screen.getByTestId('start-button'));
      expect(screen.getByText(/update failed/i)).toBeInTheDocument();

      await userEvent.click(screen.getByTestId('start-button'));
      expect(screen.queryByText(/update failed/i)).not.toBeInTheDocument();
    });
  });
});
