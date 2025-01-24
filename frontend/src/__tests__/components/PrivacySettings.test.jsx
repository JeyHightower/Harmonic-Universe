import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { vi } from 'vitest';
import PrivacySettings from '../../components/Universe/PrivacySettings';
import universeReducer from '../../store/slices/universeSlice';

// Mock the Redux action
vi.mock('../../store/slices/universeSlice', async () => {
  const actual = await vi.importActual('../../store/slices/universeSlice');
  return {
    ...actual,
    updateUniversePrivacy: () => ({
      type: 'universe/updatePrivacy',
      payload: {},
    }),
  };
});

describe('PrivacySettings', () => {
  const mockStore = configureStore({
    reducer: {
      universe: universeReducer,
    },
  });

  const mockUniverse = {
    id: 1,
    is_public: false,
    allow_guests: false,
    collaborators: ['collaborator@example.com'],
    viewers: ['viewer@example.com'],
  };

  const mockOnClose = vi.fn();

  const renderComponent = (props = {}) => {
    const defaultProps = {
      open: true,
      onClose: mockOnClose,
      universe: mockUniverse,
      ...props,
    };

    return render(
      <Provider store={mockStore}>
        <PrivacySettings {...defaultProps} />
      </Provider>
    );
  };

  beforeEach(() => {
    mockOnClose.mockReset();
  });

  it('renders with initial settings', () => {
    renderComponent();

    expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
    expect(screen.getByText('Private Universe')).toBeInTheDocument();
    expect(screen.getByText('Allow Guest Access')).toBeInTheDocument();
  });

  it('displays current collaborators and viewers', () => {
    renderComponent();

    expect(screen.getByText('collaborator@example.com')).toBeInTheDocument();
    expect(screen.getByText('viewer@example.com')).toBeInTheDocument();
  });

  it('toggles public/private setting', () => {
    renderComponent();

    const publicSwitch = screen.getByRole('checkbox', { name: /Private Universe/i });
    fireEvent.click(publicSwitch);

    expect(screen.getByText('Public Universe')).toBeInTheDocument();
  });

  it('toggles guest access setting', () => {
    renderComponent();

    const guestSwitch = screen.getByRole('checkbox', { name: /Allow Guest Access/i });
    fireEvent.click(guestSwitch);

    expect(guestSwitch).toBeChecked();
  });

  it('adds new collaborator', () => {
    renderComponent();

    const input = screen.getByPlaceholderText('Add collaborator by email');
    fireEvent.change(input, { target: { value: 'new@example.com' } });
    fireEvent.click(screen.getByTestId('PersonAddIcon'));

    expect(screen.getByText('new@example.com')).toBeInTheDocument();
  });

  it('removes collaborator', () => {
    renderComponent();

    const deleteButton = screen.getByText('collaborator@example.com')
      .nextElementSibling;
    fireEvent.click(deleteButton);

    expect(screen.queryByText('collaborator@example.com')).not.toBeInTheDocument();
  });

  it('adds new viewer', () => {
    renderComponent();

    const input = screen.getByPlaceholderText('Add viewer by email');
    fireEvent.change(input, { target: { value: 'new@example.com' } });
    fireEvent.click(screen.getAllByTestId('PersonAddIcon')[1]);

    expect(screen.getByText('new@example.com')).toBeInTheDocument();
  });

  it('removes viewer', () => {
    renderComponent();

    const deleteButton = screen.getByText('viewer@example.com')
      .nextElementSibling;
    fireEvent.click(deleteButton);

    expect(screen.queryByText('viewer@example.com')).not.toBeInTheDocument();
  });

  it('saves settings and closes modal', async () => {
    renderComponent();

    const saveButton = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('shows error message when save fails', async () => {
    vi.spyOn(mockStore, 'dispatch').mockImplementationOnce(() => {
      throw new Error('Failed to save');
    });

    renderComponent();

    const saveButton = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update privacy settings')).toBeInTheDocument();
    });
  });
});
