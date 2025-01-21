import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AudioControls from '../AudioControls';

describe('AudioControls Component', () => {
  const defaultProps = {
    harmony: 0.5,
    tempo: 120,
    musicalKey: 'C',
    scale: 'major',
    onParameterChange: vi.fn(),
    isLoading: false,
    error: null,
  };

  const renderComponent = (props = {}) => {
    return render(<AudioControls {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all audio control elements', () => {
    renderComponent();

    // Main heading
    expect(
      screen.getByRole('heading', { name: 'Audio Controls', level: 2 })
    ).toBeInTheDocument();

    // Info heading
    expect(
      screen.getByRole('heading', { name: 'About Audio Controls', level: 3 })
    ).toBeInTheDocument();

    // Controls
    expect(screen.getByLabelText(/harmony/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tempo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/scale/i)).toBeInTheDocument();
  });

  it('handles parameter changes', async () => {
    const onParameterChange = vi.fn();
    renderComponent({ onParameterChange });

    const harmonySlider = screen.getByLabelText(/harmony/i);
    fireEvent.change(harmonySlider, { target: { value: '0.8' } });
    expect(onParameterChange).toHaveBeenCalledWith('harmony', 0.8);

    const tempoSlider = screen.getByLabelText(/tempo/i);
    fireEvent.change(tempoSlider, { target: { value: '140' } });
    expect(onParameterChange).toHaveBeenCalledWith('tempo', 140);

    const keySelect = screen.getByLabelText(/key/i);
    await userEvent.selectOptions(keySelect, 'G');
    expect(onParameterChange).toHaveBeenCalledWith('musicalKey', 'G');

    const scaleSelect = screen.getByLabelText(/scale/i);
    await userEvent.selectOptions(scaleSelect, 'minor');
    expect(onParameterChange).toHaveBeenCalledWith('scale', 'minor');
  });

  it('displays loading state during updates', () => {
    renderComponent({ isLoading: true });
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    expect(screen.getByLabelText(/harmony/i)).toBeDisabled();
    expect(screen.getByLabelText(/tempo/i)).toBeDisabled();
    expect(screen.getByLabelText(/key/i)).toBeDisabled();
    expect(screen.getByLabelText(/scale/i)).toBeDisabled();
  });

  it('displays error messages', () => {
    const error = 'Failed to update audio settings';
    renderComponent({ error });
    expect(screen.getByTestId('error-message')).toHaveTextContent(error);
  });

  it('validates parameter ranges', () => {
    const onParameterChange = vi.fn();
    renderComponent({ onParameterChange });

    const harmonySlider = screen.getByLabelText(/harmony/i);
    fireEvent.change(harmonySlider, { target: { value: '1.5' } });

    expect(screen.getByTestId('validation-error')).toHaveTextContent(
      /harmony must be between 0 and 1/i
    );
    expect(onParameterChange).not.toHaveBeenCalled();
  });

  it('maintains settings across page navigation', () => {
    const { rerender } = renderComponent();

    const harmonySlider = screen.getByLabelText(/harmony/i);
    expect(harmonySlider.getAttribute('value')).toBe('0.5');

    const tempoSlider = screen.getByLabelText(/tempo/i);
    expect(tempoSlider.getAttribute('value')).toBe('120');

    const keySelect = screen.getByLabelText(/key/i);
    expect(keySelect.value).toBe('C');

    const scaleSelect = screen.getByLabelText(/scale/i);
    expect(scaleSelect.value).toBe('major');

    rerender(<AudioControls {...defaultProps} harmony={0.7} tempo={140} />);

    expect(screen.getByLabelText(/harmony/i).getAttribute('value')).toBe('0.7');
    expect(screen.getByLabelText(/tempo/i).getAttribute('value')).toBe('140');
  });

  it('is responsive on different screen sizes', () => {
    const { container } = renderComponent();

    // Test mobile view
    window.innerWidth = 375;
    fireEvent.resize(window);
    expect(container.querySelector('._mobile-view_ff8cf6')).toBeInTheDocument();

    // Test desktop view
    window.innerWidth = 1024;
    fireEvent.resize(window);
    expect(
      container.querySelector('._desktop-view_ff8cf6')
    ).toBeInTheDocument();
  });
});
