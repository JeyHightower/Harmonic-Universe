import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import GlobalErrorBoundary from '../../components/Common/GlobalErrorBoundary';
import { logError } from '../../services/errorLogging';

// Mock the error logging service
jest.mock('../../services/errorLogging', () => ({
  logError: jest.fn(),
  ERROR_SEVERITY: {
    CRITICAL: 'critical',
    ERROR: 'error',
  },
  ERROR_CATEGORIES: {
    BUSINESS_LOGIC: 'business_logic',
  },
}));

const mockStore = configureStore([]);

describe('GlobalErrorBoundary', () => {
  let store;
  let consoleError;

  beforeEach(() => {
    // Mock console.error to prevent React error logging
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    store = mockStore({
      auth: {
        user: {
          id: '123',
          email: 'test@example.com',
        },
      },
    });
  });

  afterEach(() => {
    consoleError.mockRestore();
    jest.clearAllMocks();
  });

  const ThrowError = ({ message }) => {
    throw new Error(message);
  };

  it('renders children when there is no error', () => {
    const { getByText } = render(
      <Provider store={store}>
        <GlobalErrorBoundary>
          <div>Test Content</div>
        </GlobalErrorBoundary>
      </Provider>
    );

    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('renders error UI when an error occurs', () => {
    const errorMessage = 'Test error message';

    render(
      <Provider store={store}>
        <GlobalErrorBoundary>
          <ThrowError message={errorMessage} />
        </GlobalErrorBoundary>
      </Provider>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Reset Application')).toBeInTheDocument();
  });

  it('logs error when an error occurs', () => {
    const errorMessage = 'Test error message';

    render(
      <Provider store={store}>
        <GlobalErrorBoundary>
          <ThrowError message={errorMessage} />
        </GlobalErrorBoundary>
      </Provider>
    );

    expect(logError).toHaveBeenCalled();
  });

  it('shows technical details when showDetails prop is true', () => {
    const errorMessage = 'Test error message';

    render(
      <Provider store={store}>
        <GlobalErrorBoundary showDetails={true}>
          <ThrowError message={errorMessage} />
        </GlobalErrorBoundary>
      </Provider>
    );

    expect(screen.getByText('Technical Details')).toBeInTheDocument();
  });

  it('hides technical details when showDetails prop is false', () => {
    const errorMessage = 'Test error message';

    render(
      <Provider store={store}>
        <GlobalErrorBoundary showDetails={false}>
          <ThrowError message={errorMessage} />
        </GlobalErrorBoundary>
      </Provider>
    );

    expect(screen.queryByText('Technical Details')).not.toBeInTheDocument();
  });

  it('shows support email link when provided', () => {
    const errorMessage = 'Test error message';
    const supportEmail = 'support@test.com';

    render(
      <Provider store={store}>
        <GlobalErrorBoundary supportEmail={supportEmail}>
          <ThrowError message={errorMessage} />
        </GlobalErrorBoundary>
      </Provider>
    );

    expect(screen.getByText('Contact Support')).toBeInTheDocument();
  });

  it('calls onRetry prop when retry button is clicked', () => {
    const onRetry = jest.fn();
    const errorMessage = 'Test error message';

    render(
      <Provider store={store}>
        <GlobalErrorBoundary onRetry={onRetry}>
          <ThrowError message={errorMessage} />
        </GlobalErrorBoundary>
      </Provider>
    );

    fireEvent.click(screen.getByText('Try Again'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('handles critical errors correctly', () => {
    const errorMessage = 'Memory leak detected';

    render(
      <Provider store={store}>
        <GlobalErrorBoundary>
          <ThrowError message={errorMessage} />
        </GlobalErrorBoundary>
      </Provider>
    );

    expect(screen.getByText('Critical Error')).toBeInTheDocument();
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('disables retry button after 3 attempts', () => {
    const errorMessage = 'Test error message';

    const { rerender } = render(
      <Provider store={store}>
        <GlobalErrorBoundary>
          <ThrowError message={errorMessage} />
        </GlobalErrorBoundary>
      </Provider>
    );

    // Simulate 3 retry attempts
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByText('Try Again'));
      rerender(
        <Provider store={store}>
          <GlobalErrorBoundary>
            <ThrowError message={errorMessage} />
          </GlobalErrorBoundary>
        </Provider>
      );
    }

    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('clears error state when error is resolved', () => {
    const TestComponent = ({ shouldThrow }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Test Content</div>;
    };

    const { rerender } = render(
      <Provider store={store}>
        <GlobalErrorBoundary>
          <TestComponent shouldThrow={true} />
        </GlobalErrorBoundary>
      </Provider>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    rerender(
      <Provider store={store}>
        <GlobalErrorBoundary>
          <TestComponent shouldThrow={false} />
        </GlobalErrorBoundary>
      </Provider>
    );

    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
