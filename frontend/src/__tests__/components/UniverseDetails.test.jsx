import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import UniverseDetails from '../../pages/UniverseDetails';
import authReducer from '../../store/slices/authSlice';
import universeReducer from '../../store/slices/universeSlice';

// Mock the WebSocket service
vi.mock('../../services/WebSocketService', () => ({
  WebSocketService: {
    getInstance: () => ({
      joinUniverse: vi.fn(),
      leaveUniverse: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    }),
  },
}));

describe('UniverseDetails', () => {
  const mockStore = configureStore({
    reducer: {
      universe: universeReducer,
      auth: authReducer,
    },
    preloadedState: {
      universe: {
        universe: {
          id: 1,
          name: 'Test Universe',
          description: 'Test Description',
          creator_id: 1,
          creator_name: 'Test Creator',
          created_at: '2024-01-23T00:00:00.000Z',
          is_public: true,
          physics_enabled: true,
          music_enabled: true,
          physics_parameters: {
            gravity: 50,
            friction: 0.5,
          },
          music_parameters: {
            tempo: 120,
            harmony: 0.7,
          },
        },
        loading: false,
        error: null,
      },
      auth: {
        user: {
          id: 1,
          username: 'testuser',
        },
      },
    },
  });

  const renderComponent = () => {
    return render(
      <Provider store={mockStore}>
        <MemoryRouter initialEntries={['/universes/1']}>
          <Routes>
            <Route path="/universes/:id" element={<UniverseDetails />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
  };

  it('renders universe details correctly', () => {
    renderComponent();

    expect(screen.getByText('Test Universe')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText(/Test Creator/)).toBeInTheDocument();
  });

  it('shows edit and delete buttons for owner', () => {
    renderComponent();

    expect(screen.getByTestId('EditIcon')).toBeInTheDocument();
    expect(screen.getByTestId('DeleteIcon')).toBeInTheDocument();
  });

  it('shows parameter tabs correctly', () => {
    renderComponent();

    expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Physics' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Music' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Visualization' })).toBeInTheDocument();
  });

  it('switches between tabs correctly', () => {
    renderComponent();

    const physicsTab = screen.getByRole('tab', { name: 'Physics' });
    fireEvent.click(physicsTab);

    expect(screen.getByText('Gravity')).toBeInTheDocument();
    expect(screen.getByText('Friction')).toBeInTheDocument();
  });

  it('opens privacy settings modal', () => {
    renderComponent();

    const settingsButton = screen.getByTestId('SettingsIcon').closest('button');
    fireEvent.click(settingsButton);

    expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
  });
});
