import { act, render } from '@testing-library/react';
import Matter from 'matter-js';
import React from 'react';
import PhysicsSimulation from '../components/Physics/PhysicsSimulation';

jest.mock('matter-js', () => ({
  Engine: {
    create: jest.fn(() => ({
      world: {
        gravity: { y: 1 },
        bodies: [],
      },
    })),
    update: jest.fn(),
  },
  Render: {
    create: jest.fn(() => ({
      canvas: document.createElement('canvas'),
      run: jest.fn(),
    })),
    stop: jest.fn(),
  },
  Runner: {
    create: jest.fn(),
    run: jest.fn(),
  },
  Bodies: {
    circle: jest.fn(() => ({
      id: 'circle',
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
    })),
    rectangle: jest.fn(() => ({
      id: 'rectangle',
      position: { x: 0, y: 0 },
    })),
  },
  World: {
    add: jest.fn(),
    remove: jest.fn(),
  },
  Body: {
    setVelocity: jest.fn(),
    setPosition: jest.fn(),
  },
}));

describe('PhysicsSimulation', () => {
  const defaultProps = {
    parameters: {
      bassFrequency: 100,
      midFrequency: 1000,
      highFrequency: 5000,
    },
    isPlaying: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes physics engine', () => {
    render(<PhysicsSimulation {...defaultProps} />);
    expect(Matter.Engine.create).toHaveBeenCalled();
    expect(Matter.Render.create).toHaveBeenCalled();
    expect(Matter.Runner.create).toHaveBeenCalled();
  });

  test('creates initial bodies', () => {
    render(<PhysicsSimulation {...defaultProps} />);
    expect(Matter.Bodies.circle).toHaveBeenCalled();
    expect(Matter.Bodies.rectangle).toHaveBeenCalled();
    expect(Matter.World.add).toHaveBeenCalled();
  });

  test('updates physics based on audio parameters', () => {
    const { rerender } = render(<PhysicsSimulation {...defaultProps} />);

    const newProps = {
      ...defaultProps,
      parameters: {
        bassFrequency: 200,
        midFrequency: 2000,
        highFrequency: 8000,
      },
    };

    rerender(<PhysicsSimulation {...newProps} />);
    expect(Matter.Body.setVelocity).toHaveBeenCalled();
  });

  test('starts simulation when playing', () => {
    const { rerender } = render(<PhysicsSimulation {...defaultProps} />);

    rerender(<PhysicsSimulation {...defaultProps} isPlaying={true} />);
    expect(Matter.Runner.run).toHaveBeenCalled();
  });

  test('stops simulation when not playing', () => {
    const { rerender } = render(
      <PhysicsSimulation {...defaultProps} isPlaying={true} />
    );

    rerender(<PhysicsSimulation {...defaultProps} isPlaying={false} />);
    expect(Matter.Render.stop).toHaveBeenCalled();
  });

  test('cleans up on unmount', () => {
    const { unmount } = render(<PhysicsSimulation {...defaultProps} />);
    unmount();
    expect(Matter.World.remove).toHaveBeenCalled();
  });

  test('handles window resize', () => {
    render(<PhysicsSimulation {...defaultProps} />);

    act(() => {
      global.innerWidth = 1024;
      global.innerHeight = 768;
      global.dispatchEvent(new Event('resize'));
    });

    expect(Matter.Render.create).toHaveBeenCalledTimes(2);
  });

  test('updates body positions based on frequency', () => {
    render(<PhysicsSimulation {...defaultProps} />);

    act(() => {
      const bodies = Matter.Engine.create().world.bodies;
      bodies.forEach(body => {
        expect(Matter.Body.setPosition).toHaveBeenCalledWith(
          body,
          expect.any(Object)
        );
      });
    });
  });

  test('handles frequency thresholds', () => {
    const highFrequencyProps = {
      ...defaultProps,
      parameters: {
        bassFrequency: 1000,
        midFrequency: 5000,
        highFrequency: 15000,
      },
    };

    render(<PhysicsSimulation {...highFrequencyProps} />);
    expect(Matter.Body.setVelocity).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
      })
    );
  });

  test('maintains aspect ratio on canvas resize', () => {
    render(<PhysicsSimulation {...defaultProps} />);

    act(() => {
      global.innerWidth = 800;
      global.innerHeight = 600;
      global.dispatchEvent(new Event('resize'));
    });

    expect(Matter.Render.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number),
        }),
      })
    );
  });

  test('handles touch events', () => {
    const { container } = render(<PhysicsSimulation {...defaultProps} />);
    const canvas = container.querySelector('canvas');

    act(() => {
      canvas.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [{ clientX: 100, clientY: 100 }],
        })
      );
    });

    expect(Matter.Body.setPosition).toHaveBeenCalled();
  });
});
