import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import UserPreferences from '../../../components/Settings/UserPreferences';
import preferencesReducer from '../../../redux/slices/preferencesSlice';

const mockStore = configureStore({
  reducer: {
    preferences: preferencesReducer,
  },
});

describe('UserPreferences Component', () => {
  const renderPreferences = () => {
    render(
      <Provider store={mockStore}>
        <UserPreferences />
      </Provider>
    );
  };

  test('renders preferences form', () => {
    renderPreferences();
    expect(screen.getByLabelText(/theme/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email notifications/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  test('handles theme change', async () => {
    renderPreferences();

    const themeSelect = screen.getByLabelText(/theme/i);
    fireEvent.change(themeSelect, { target: { value: 'dark' } });

    await waitFor(() => {
      expect(themeSelect.value).toBe('dark');
    });
  });

  test('handles language change', async () => {
    renderPreferences();

    const languageSelect = screen.getByLabelText(/language/i);
    fireEvent.change(languageSelect, { target: { value: 'es' } });

    await waitFor(() => {
      expect(languageSelect.value).toBe('es');
    });
  });

  test('handles email notifications toggle', async () => {
    renderPreferences();

    const notificationsToggle = screen.getByLabelText(/email notifications/i);
    fireEvent.click(notificationsToggle);

    await waitFor(() => {
      expect(notificationsToggle).toBeChecked();
    });
  });

  test('handles form submission', async () => {
    renderPreferences();

    fireEvent.change(screen.getByLabelText(/theme/i), {
      target: { value: 'dark' },
    });
    fireEvent.change(screen.getByLabelText(/language/i), {
      target: { value: 'es' },
    });
    fireEvent.click(screen.getByLabelText(/email notifications/i));

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/preferences saved/i)).toBeInTheDocument();
    });
  });
});
