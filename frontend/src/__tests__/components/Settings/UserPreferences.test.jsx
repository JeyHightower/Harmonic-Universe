/**
 * @vitest-environment jsdom
 */
import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import UserPreferences from '../../../components/Settings/UserPreferences';
import preferencesReducer, {
  updatePreferences,
} from '../../../store/slices/preferencesSlice';

// Mock the preferences actions
vi.mock('../../../store/slices/preferencesSlice', () => ({
  updatePreferences: vi.fn(() => ({
    type: 'preferences/updatePreferences',
    payload: undefined,
  })),
  __esModule: true,
  default: (
    state = { theme: 'light', language: 'en', emailNotifications: false }
  ) => state,
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('UserPreferences Component', () => {
  const mockPreferences = {
    theme: 'light',
    language: 'en',
    emailNotifications: false,
  };

  const renderWithProviders = (
    ui,
    {
      preloadedState = {
        preferences: mockPreferences,
      },
      store = configureStore({
        reducer: {
          preferences: preferencesReducer,
        },
        preloadedState,
      }),
      ...renderOptions
    } = {}
  ) => {
    const Wrapper = ({ children }) => (
      <Provider store={store}>
        <BrowserRouter>{children}</BrowserRouter>
      </Provider>
    );
    return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
  };

  it('renders preferences form', () => {
    renderWithProviders(<UserPreferences />);

    expect(screen.getByLabelText(/theme/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email notifications/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('handles theme change', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserPreferences />);

    const themeSelect = screen.getByLabelText(/theme/i);
    await user.selectOptions(themeSelect, 'dark');

    expect(themeSelect).toHaveValue('dark');
  });

  it('handles language change', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserPreferences />);

    const languageSelect = screen.getByLabelText(/language/i);
    await user.selectOptions(languageSelect, 'es');

    expect(languageSelect).toHaveValue('es');
  });

  it('handles email notifications toggle', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserPreferences />);

    const notificationsToggle = screen.getByLabelText(/email notifications/i);
    await user.click(notificationsToggle);

    expect(notificationsToggle).toBeChecked();
  });

  it('handles successful preferences update', async () => {
    const mockDispatch = vi.fn(() => ({
      unwrap: () => Promise.resolve(mockPreferences),
    }));
    const user = userEvent.setup();
    const { store } = renderWithProviders(<UserPreferences />);
    store.dispatch = mockDispatch;

    await user.selectOptions(screen.getByLabelText(/theme/i), 'dark');
    await user.selectOptions(screen.getByLabelText(/language/i), 'es');
    await user.click(screen.getByLabelText(/email notifications/i));
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(updatePreferences).toHaveBeenCalledWith({
        theme: 'dark',
        language: 'es',
        emailNotifications: true,
      });
      expect(screen.getByText(/preferences saved/i)).toBeInTheDocument();
    });
  });

  it('handles update error', async () => {
    const mockError = new Error('Failed to update preferences');
    const mockDispatch = vi.fn(() => ({
      unwrap: () => Promise.reject(mockError),
    }));
    const user = userEvent.setup();
    const { store } = renderWithProviders(<UserPreferences />);
    store.dispatch = mockDispatch;

    await user.selectOptions(screen.getByLabelText(/theme/i), 'dark');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/failed to update preferences/i)
      ).toBeInTheDocument();
    });
  });

  it('disables save button while updating', async () => {
    const mockDispatch = vi.fn(() => ({
      unwrap: () => new Promise(() => {}), // Never resolves to keep loading state
    }));
    const user = userEvent.setup();
    const { store } = renderWithProviders(<UserPreferences />);
    store.dispatch = mockDispatch;

    await user.selectOptions(screen.getByLabelText(/theme/i), 'dark');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(
      screen.getByRole('button', { name: /saving\.\.\./i })
    ).toBeDisabled();
  });
});
