import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Slider from '../Slider';

describe('Slider Component', () => {
  const defaultProps = {
    id: 'test-slider',
    value: 50,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with default props', () => {
    render(<Slider {...defaultProps} />);

    // Check that the slider exists
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('id', 'test-slider');
    expect(slider).toHaveValue('50');

    // Check that the value display exists
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
  });

  test('renders with custom min, max, and step values', () => {
    render(
      <Slider {...defaultProps} min={10} max={200} step={5} value={100} />
    );

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '10');
    expect(slider).toHaveAttribute('max', '200');
    expect(slider).toHaveAttribute('step', '5');
    expect(slider).toHaveValue('100');
  });

  test('calls onChange when slider value changes', async () => {
    render(<Slider {...defaultProps} />);

    const slider = screen.getByRole('slider');

    // Change the slider value
    fireEvent.change(slider, { target: { value: '75' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith(75);
  });

  test('calls onChange when number input value changes', async () => {
    render(<Slider {...defaultProps} />);

    const numberInput = screen.getByDisplayValue('50');

    // Change the number input value
    await userEvent.clear(numberInput);
    await userEvent.type(numberInput, '75');
    fireEvent.change(numberInput, { target: { value: '75' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith(75);
  });

  test('formats value with prefix and suffix', () => {
    render(
      <Slider
        {...defaultProps}
        value={42.5}
        valuePrefix="$"
        valueSuffix=" units"
        decimalPlaces={1}
      />
    );

    // The formatted value should be displayed
    expect(screen.getByText('$42.5 units')).toBeInTheDocument();
  });

  test('disables slider when disabled prop is true', () => {
    render(<Slider {...defaultProps} disabled={true} />);

    const slider = screen.getByRole('slider');
    const numberInput = screen.getByDisplayValue('50');

    expect(slider).toBeDisabled();
    expect(numberInput).toBeDisabled();
    expect(slider.closest('.slider-container')).toHaveClass('disabled');
  });

  test('hides value display when showValue is false', () => {
    render(<Slider {...defaultProps} showValue={false} />);

    // The number input should not be rendered
    expect(screen.queryByDisplayValue('50')).not.toBeInTheDocument();
  });

  test('updates local value when prop value changes', () => {
    const { rerender } = render(<Slider {...defaultProps} />);

    // Initial value
    expect(screen.getByRole('slider')).toHaveValue('50');

    // Update the value prop
    rerender(<Slider {...defaultProps} value={75} />);

    // Value should be updated
    expect(screen.getByRole('slider')).toHaveValue('75');
    expect(screen.getByDisplayValue('75')).toBeInTheDocument();
  });

  test('handles mouse interactions on the track', () => {
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 100,
      height: 10,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
    }));

    render(<Slider {...defaultProps} min={0} max={100} />);

    const track = screen
      .getByRole('slider')
      .closest('.slider-container')
      .querySelector('.slider-track');

    // Click at 75% of the track width
    fireEvent.mouseDown(track, { clientX: 75 });

    // Should update to approximately 75
    expect(defaultProps.onChange).toHaveBeenCalledWith(75);
  });
});
