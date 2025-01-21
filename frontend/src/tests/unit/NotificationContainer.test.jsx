import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import NotificationContainer from '../../components/Common/NotificationContainer';
import { NotificationProvider } from '../../contexts/NotificationContext';

// Mock the ErrorMessage and SuccessMessage components
jest.mock('../../components/Common/ErrorMessage', () => {
  return function MockErrorMessage({ message, onDismiss }) {
    return (
      <div data-testid="error-message">
        {message}
        <button onClick={onDismiss}>Dismiss</button>
      </div>
    );
  };
});

jest.mock('../../components/Common/SuccessMessage', () => {
  return function MockSuccessMessage({ message, onDismiss }) {
    return (
      <div data-testid="success-message">
        {message}
        <button onClick={onDismiss}>Dismiss</button>
      </div>
    );
  };
});

describe('NotificationContainer', () => {
  const renderWithProvider = () => {
    return render(
      <NotificationProvider>
        <NotificationContainer />
      </NotificationProvider>
    );
  };

  it('renders nothing when there are no notifications', () => {
    renderWithProvider();
    expect(
      screen.queryByTestId('notification-container')
    ).not.toBeInTheDocument();
  });

  it('renders error notifications', async () => {
    renderWithProvider();
    const event = new CustomEvent('show-error', {
      detail: {
        message: 'Test error',
        type: 'error',
      },
    });
    window.dispatchEvent(event);

    expect(await screen.findByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders success notifications', async () => {
    renderWithProvider();
    const event = new CustomEvent('show-success', {
      detail: {
        message: 'Test success',
        type: 'success',
      },
    });
    window.dispatchEvent(event);

    expect(await screen.findByTestId('success-message')).toBeInTheDocument();
    expect(screen.getByText('Test success')).toBeInTheDocument();
  });

  it('removes notifications when dismissed', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    const event = new CustomEvent('show-error', {
      detail: {
        message: 'Test error',
        type: 'error',
      },
    });
    window.dispatchEvent(event);

    const errorMessage = await screen.findByTestId('error-message');
    expect(errorMessage).toBeInTheDocument();

    const dismissButton = screen.getByText('Dismiss');
    await user.click(dismissButton);

    expect(errorMessage).not.toBeInTheDocument();
  });

  it('handles multiple notifications', async () => {
    renderWithProvider();

    // Add error notification
    window.dispatchEvent(
      new CustomEvent('show-error', {
        detail: {
          message: 'Test error',
          type: 'error',
        },
      })
    );

    // Add success notification
    window.dispatchEvent(
      new CustomEvent('show-success', {
        detail: {
          message: 'Test success',
          type: 'success',
        },
      })
    );

    expect(await screen.findByText('Test error')).toBeInTheDocument();
    expect(screen.getByText('Test success')).toBeInTheDocument();
  });

  it('renders notifications with different variants', async () => {
    renderWithProvider();

    window.dispatchEvent(
      new CustomEvent('show-error', {
        detail: {
          message: 'Toast error',
          type: 'error',
          variant: 'toast',
        },
      })
    );

    window.dispatchEvent(
      new CustomEvent('show-error', {
        detail: {
          message: 'Inline error',
          type: 'error',
          variant: 'inline',
        },
      })
    );

    expect(await screen.findByText('Toast error')).toBeInTheDocument();
    expect(screen.getByText('Inline error')).toBeInTheDocument();
  });

  it('handles notifications with custom durations', async () => {
    jest.useFakeTimers();
    renderWithProvider();

    window.dispatchEvent(
      new CustomEvent('show-error', {
        detail: {
          message: 'Quick notification',
          type: 'error',
          duration: 1000,
        },
      })
    );

    expect(await screen.findByText('Quick notification')).toBeInTheDocument();

    jest.advanceTimersByTime(1000);

    expect(screen.queryByText('Quick notification')).not.toBeInTheDocument();
    jest.useRealTimers();
  });
});
