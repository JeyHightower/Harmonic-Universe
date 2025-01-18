import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import PhysicsSimulation from '../../components/Physics/PhysicsSimulation';
import audioReducer from '../../redux/audioSlice';
import physicsReducer from '../../redux/physicsSlice';
import AudioAnalyzer from '../../services/AudioAnalyzer';

jest.mock('../../services/AudioAnalyzer');

const mockStore = configureStore({
  reducer: {
    audio: audioReducer,
    physics: physicsReducer,
  },
});

describe('Physics-Audio Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AudioAnalyzer.mockImplementation(() => ({
      getParameters: jest.fn().mockReturnValue({
        bassFrequency: 0.5,
        midFrequency: 0.3,
        highFrequency: 0.7,
      }),
    }));
  });

  test('physics simulation responds to audio parameters', async () => {
    render(
      <Provider store={mockStore}>
        <PhysicsSimulation isPlaying={true} />
      </Provider>
    );

    const simulation = screen.getByTestId('physics-simulation');

    await waitFor(() => {
      expect(simulation).toHaveAttribute('data-gravity', '1.5');
      expect(simulation).toHaveAttribute('data-air-resistance', '0.3');
    });
  });

  test('particle generation based on frequency', async () => {
    render(
      <Provider store={mockStore}>
        <PhysicsSimulation isPlaying={true} />
      </Provider>
    );

    await waitFor(() => {
      const particles = screen.getAllByTestId('physics-particle');
      expect(particles.length).toBeGreaterThan(0);
    });
  });

  test('physics parameters affect particle behavior', async () => {
    render(
      <Provider store={mockStore}>
        <PhysicsSimulation isPlaying={true} />
      </Provider>
    );

    const gravityControl = screen.getByTestId('gravity-control');
    fireEvent.change(gravityControl, { target: { value: '2.0' } });

    await waitFor(() => {
      const simulation = screen.getByTestId('physics-simulation');
      expect(simulation).toHaveAttribute('data-gravity', '2.0');
    });
  });

  test('synchronization with audio beats', async () => {
    AudioAnalyzer.mockImplementation(() => ({
      getParameters: jest.fn().mockReturnValue({
        bassFrequency: 0.8, // Strong bass beat
        midFrequency: 0.3,
        highFrequency: 0.2,
      }),
    }));

    render(
      <Provider store={mockStore}>
        <PhysicsSimulation isPlaying={true} />
      </Provider>
    );

    await waitFor(() => {
      const particles = screen.getAllByTestId('physics-particle');
      const energeticParticles = particles.filter(
        p => p.getAttribute('data-velocity') > 5
      );
      expect(energeticParticles.length).toBeGreaterThan(0);
    });
  });

  test('handles audio analysis errors gracefully', async () => {
    AudioAnalyzer.mockImplementation(() => ({
      getParameters: jest.fn().mockImplementation(() => {
        throw new Error('Audio analysis failed');
      }),
    }));

    render(
      <Provider store={mockStore}>
        <PhysicsSimulation isPlaying={true} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Audio analysis error/i)).toBeInTheDocument();
    });
  });

  test('pauses physics simulation when audio stops', async () => {
    const { rerender } = render(
      <Provider store={mockStore}>
        <PhysicsSimulation isPlaying={true} />
      </Provider>
    );

    rerender(
      <Provider store={mockStore}>
        <PhysicsSimulation isPlaying={false} />
      </Provider>
    );

    await waitFor(() => {
      const simulation = screen.getByTestId('physics-simulation');
      expect(simulation).toHaveAttribute('data-paused', 'true');
    });
  });
});
