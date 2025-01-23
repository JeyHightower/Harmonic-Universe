import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from '../../../../frontend/src/componen../../shared/components/ErrorBoundary';

// Prevent console.error from cluttering test output
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});

const ErrorComponent = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Test Content</div>;
};

const CustomFallback = ({ error, onRetry }) => (
  <div>
    <h2>Custom error: {error.message}</h2>
    <button onClick={onRetry}>Custom retry</button>
  </div>
);

describe('ErrorBoundary', () => {
  it('should render children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ErrorComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('should render error message when there is an error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(getByText('Something went wrong')).toBeInTheDocument();
    expect(getByText('Test error')).toBeInTheDocument();
  });

  it('should call error reporting service when error occurs', () => {
    const mockReportError = vi.fn();
    render(
      <ErrorBoundary onError={mockReportError}>
        <ErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(mockReportError).toHaveBeenCalledWith(new Error('Test error'));
  });

  it('renders custom fallback when provided', () => {
    const { getByText } = render(
      <ErrorBoundary FallbackComponent={CustomFallback}>
        <ErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(getByText('Custom error: Test error')).toBeInTheDocument();
    expect(getByText('Custom retry')).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', async () => {
    const onRetry = vi.fn();
    const { getByText } = render(
      <ErrorBoundary onRetry={onRetry}>
        <ErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    await userEvent.click(getByText('Try Again'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('resets error state when retry is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    let shouldThrow = true;

    const TestComponent = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Test Content</div>;
    };

    const { getByText, rerender } = render(
      <ErrorBoundary
        onRetry={() => {
          shouldThrow = false;
          onRetry();
        }}
      >
        <TestComponent />
      </ErrorBoundary>
    );

    // Initial render should show error
    expect(getByText('Something went wrong')).toBeInTheDocument();
    expect(getByText('Test error')).toBeInTheDocument();

    // Click retry
    await user.click(getByText('Try Again'));
    expect(onRetry).toHaveBeenCalled();

    // Rerender to trigger update
    rerender(
      <ErrorBoundary
        onRetry={() => {
          shouldThrow = false;
          onRetry();
        }}
      >
        <TestComponent />
      </ErrorBoundary>
    );

    // Should now show content
    expect(getByText('Test Content')).toBeInTheDocument();
  });
});
