import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import ErrorMessage from '../../components/Common/ErrorMessage';

describe('ErrorMessage', () => {
  const defaultProps = {
    message: 'Test error message',
  };

  it('renders with required props', () => {
    render(<ErrorMessage {...defaultProps} />);
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('renders with details', () => {
    render(
      <ErrorMessage {...defaultProps} details="Additional error details" />
    );
    expect(screen.getByText('Additional error details')).toBeInTheDocument();
  });

  it('renders with category', () => {
    render(<ErrorMessage {...defaultProps} category="TEST_ERROR" />);
    expect(screen.getByText('TEST_ERROR')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', async () => {
    const onDismiss = jest.fn();
    const user = userEvent.setup();

    render(<ErrorMessage {...defaultProps} onDismiss={onDismiss} />);

    const dismissButton = screen.getByRole('button');
    await user.click(dismissButton);
    expect(onDismiss).toHaveBeenCalled();
  });

  it('does not render dismiss button when onDismiss is not provided', () => {
    render(<ErrorMessage {...defaultProps} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders with different severity levels', () => {
    const { rerender } = render(
      <ErrorMessage {...defaultProps} severity="error" />
    );
    expect(screen.getByText('⚠️')).toBeInTheDocument();

    rerender(<ErrorMessage {...defaultProps} severity="warning" />);
    expect(screen.getByText('⚡')).toBeInTheDocument();

    rerender(<ErrorMessage {...defaultProps} severity="info" />);
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { container } = render(
      <ErrorMessage {...defaultProps} variant="toast" />
    );
    expect(container.firstChild).toHaveClass('variant-toast');

    const { container: container2 } = render(
      <ErrorMessage {...defaultProps} variant="inline" />
    );
    expect(container2.firstChild).toHaveClass('variant-inline');
  });

  it('auto-dismisses after duration', () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();

    render(
      <ErrorMessage {...defaultProps} duration={1000} onDismiss={onDismiss} />
    );

    jest.advanceTimersByTime(1000);
    expect(onDismiss).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('does not auto-dismiss when duration is not provided', () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();

    render(<ErrorMessage {...defaultProps} onDismiss={onDismiss} />);

    jest.advanceTimersByTime(10000);
    expect(onDismiss).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('renders without icon when showIcon is false', () => {
    render(<ErrorMessage {...defaultProps} showIcon={false} />);
    expect(screen.queryByText('⚠️')).not.toBeInTheDocument();
  });
});
