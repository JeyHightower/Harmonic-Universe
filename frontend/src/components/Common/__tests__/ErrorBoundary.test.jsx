import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from '../ErrorBoundary';

describe('ErrorBoundary', () => {
  // Suppress console.error for expected errors
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  // Test components
  const TestComponent = ({ children }) => <div>{children}</div>;

  const ErrorComponent = ({ shouldThrow }) => {
    if (shouldThrow) {
      throw new Error('Test error');
    }
    return <div>Normal content</div>;
  };

  describe('Normal Rendering', () => {
    it('renders children when no error occurs', () => {
      const { container } = render(
        <ErrorBoundary>
          <TestComponent>Test content</TestComponent>
        </ErrorBoundary>
      );

      expect(container).toHaveTextContent('Test content');
    });

    it('renders multiple children without error', () => {
      const { container } = render(
        <ErrorBoundary>
          <TestComponent>First</TestComponent>
          <TestComponent>Second</TestComponent>
        </ErrorBoundary>
      );

      expect(container).toHaveTextContent('First');
      expect(container).toHaveTextContent('Second');
    });
  });

  describe('Error Handling', () => {
    it('renders error UI when error occurs', () => {
      render(
        <ErrorBoundary>
          <ErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/test error/i)).toBeInTheDocument();
    });

    it('calls error reporting service when provided', () => {
      const onError = vi.fn();
      render(
        <ErrorBoundary onError={onError}>
          <ErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
        })
      );
    });

    it('renders custom fallback component when provided', () => {
      const CustomFallback = ({ error, resetError }) => (
        <div>
          <h2>Custom Error: {error.message}</h2>
          <button onClick={resetError}>Reset</button>
        </div>
      );

      render(
        <ErrorBoundary FallbackComponent={CustomFallback}>
          <ErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/custom error: test error/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /reset/i })
      ).toBeInTheDocument();
    });
  });

  describe('Recovery', () => {
    it('resets error state when retry button is clicked', async () => {
      const user = userEvent.setup();
      let shouldThrow = true;

      const { rerender } = render(
        <ErrorBoundary>
          <ErrorComponent shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      shouldThrow = false;
      await user.click(screen.getByRole('button', { name: /try again/i }));

      rerender(
        <ErrorBoundary>
          <ErrorComponent shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Normal content')).toBeInTheDocument();
    });

    it('calls onReset callback when provided', async () => {
      const user = userEvent.setup();
      const onReset = vi.fn();

      render(
        <ErrorBoundary onReset={onReset}>
          <ErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      await user.click(screen.getByRole('button', { name: /try again/i }));
      expect(onReset).toHaveBeenCalled();
    });
  });

  describe('Error Boundary Lifecycle', () => {
    it('maintains error state across re-renders', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      rerender(
        <ErrorBoundary>
          <ErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('catches new errors after recovery', async () => {
      const user = userEvent.setup();
      let shouldThrow = true;

      const { rerender } = render(
        <ErrorBoundary>
          <ErrorComponent shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );

      // Initial error
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Recover
      shouldThrow = false;
      await user.click(screen.getByRole('button', { name: /try again/i }));
      rerender(
        <ErrorBoundary>
          <ErrorComponent shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
      expect(screen.getByText('Normal content')).toBeInTheDocument();

      // New error
      shouldThrow = true;
      rerender(
        <ErrorBoundary>
          <ErrorComponent shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });
});
