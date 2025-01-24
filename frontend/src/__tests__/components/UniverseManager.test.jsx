import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import ParameterManager from '../../components/Universe/ParameterManager';
import PrivacySettings from '../../components/Universe/PrivacySettings';
import UniverseDetails from '../../pages/UniverseDetails';
import authReducer from '../../store/slices/authSlice';
import universeReducer from '../../store/slices/universeSlice';

// Mock WebSocket service
vi.mock('../../services/WebSocketService', () => ({
  WebSocketService: {
    getInstance: () => ({
      joinUniverse: vi.fn(),
      leaveUniverse: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    }),
  },
}));

describe('Universe Management Features', () => {
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

  // Universe Details Tests
  describe('Universe Details', () => {
    const renderDetails = () => {
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

    test('renders universe information and controls', () => {
      renderDetails();

      // Basic information
      expect(screen.getByText('Test Universe')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();

      // Controls for owner
      expect(screen.getByTestId('EditIcon')).toBeInTheDocument();
      expect(screen.getByTestId('DeleteIcon')).toBeInTheDocument();

      // Parameter tabs
      const tabs = ['Overview', 'Physics', 'Music', 'Visualization'];
      tabs.forEach(tab => {
        expect(screen.getByRole('tab', { name: tab })).toBeInTheDocument();
      });

      // Test tab switching
      fireEvent.click(screen.getByRole('tab', { name: 'Physics' }));
      expect(screen.getByText('Gravity')).toBeInTheDocument();
    });
  });

  // Parameter Management Tests
  describe('Parameter Management', () => {
    const mockParameters = {
      gravity: 50,
      friction: 0.5,
    };

    test('handles parameter updates and real-time sync', async () => {
      render(
        <Provider store={mockStore}>
          <ParameterManager
            universeId="1"
            type="physics"
            parameters={mockParameters}
          />
        </Provider>
      );

      // Parameter rendering
      expect(screen.getByText('Gravity')).toBeInTheDocument();
      expect(screen.getByText('Friction')).toBeInTheDocument();

      // Update parameter
      const gravitySlider = screen.getByRole('slider', { name: /Gravity/i });
      fireEvent.change(gravitySlider, { target: { value: 75 } });
      expect(gravitySlider.value).toBe('75');

      // WebSocket emission
      const ws = WebSocketService.getInstance();
      expect(ws.emit).toHaveBeenCalledWith('parameter_update', {
        universe_id: '1',
        type: 'physics',
        parameter: 'gravity',
        value: 75,
      });

      // Reset parameters
      const resetButton = screen.getByTestId('RefreshIcon').closest('button');
      fireEvent.click(resetButton);
      expect(gravitySlider.value).toBe('50');
    });
  });

  // Privacy Settings Tests
  describe('Privacy Settings', () => {
    const mockUniverse = {
      id: 1,
      is_public: false,
      allow_guests: false,
      collaborators: ['collaborator@example.com'],
      viewers: ['viewer@example.com'],
    };

    test('manages privacy and collaboration settings', async () => {
      const onClose = vi.fn();

      render(
        <Provider store={mockStore}>
          <PrivacySettings
            open={true}
            onClose={onClose}
            universe={mockUniverse}
          />
        </Provider>
      );

      // Initial state
      expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
      expect(screen.getByText('collaborator@example.com')).toBeInTheDocument();
      expect(screen.getByText('viewer@example.com')).toBeInTheDocument();

      // Toggle settings
      fireEvent.click(screen.getByRole('checkbox', { name: /Private Universe/i }));
      fireEvent.click(screen.getByRole('checkbox', { name: /Allow Guest Access/i }));

      // Add new collaborator
      const collaboratorInput = screen.getByPlaceholderText('Add collaborator by email');
      fireEvent.change(collaboratorInput, { target: { value: 'new@example.com' } });
      fireEvent.click(screen.getByTestId('PersonAddIcon'));
      expect(screen.getByText('new@example.com')).toBeInTheDocument();

      // Remove existing collaborator
      const deleteButton = screen.getByText('collaborator@example.com')
        .nextElementSibling;
      fireEvent.click(deleteButton);
      expect(screen.queryByText('collaborator@example.com')).not.toBeInTheDocument();

      // Save settings
      fireEvent.click(screen.getByRole('button', { name: /Save/i }));
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });
});
