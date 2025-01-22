import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import NotificationsButton from '../../../components/Notifications/NotificationsButton';
import notificationsReducer from '../../../redux/slices/notificationSlice';

const mockStore = configureStore({
  reducer: {
    notifications: notificationsReducer,
  },
  preloadedState: {
    notifications: {
      notifications: [
        {
          id: 1,
          message: 'Test notification',
          read: false,
          timestamp: new Date().toISOString(),
        },
      ],
    },
  },
});

describe('NotificationsButton Component', () => {
  const renderNotificationsButton = () => {
    render(
      <Provider store={mockStore}>
        <NotificationsButton />
      </Provider>
    );
  };

  test('renders notifications button with badge', () => {
    renderNotificationsButton();
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Badge count
  });

  test('opens notifications menu on click', async () => {
    renderNotificationsButton();

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Test notification')).toBeInTheDocument();
    });
  });

  test('marks notification as read on click', async () => {
    renderNotificationsButton();

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Test notification'));

    await waitFor(() => {
      expect(screen.queryByText('1')).not.toBeInTheDocument(); // Badge should disappear
    });
  });

  test('clears all notifications', async () => {
    renderNotificationsButton();

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText(/clear all/i));

    await waitFor(() => {
      expect(screen.queryByText('Test notification')).not.toBeInTheDocument();
      expect(screen.queryByText('1')).not.toBeInTheDocument();
    });
  });
});
