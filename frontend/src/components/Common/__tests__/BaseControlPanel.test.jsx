import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import BaseControlPanel from '../BaseControlPanel';

describe('BaseControlPanel', () => {
  const mockControls = [
    {
      id: 'range1',
      label: 'Range Control',
      type: 'range',
      min: 0,
      max: 100,
      step: 1,
      valueType: 'number',
    },
    {
      id: 'select1',
      label: 'Select Control',
      type: 'select',
      options: [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ],
    },
  ];

  const mockValues = {
    range1: 50,
    select1: 'option1',
  };

  const mockInfoItems = ['Info 1', 'Info 2'];

  it('renders all controls with correct labels', () => {
    render(
      <BaseControlPanel
        title="Test Panel"
        controls={mockControls}
        values={mockValues}
        infoItems={mockInfoItems}
      />
    );

    expect(screen.getByLabelText('Range Control')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Control')).toBeInTheDocument();
  });

  it('renders range input with correct attributes', () => {
    render(
      <BaseControlPanel
        title="Test Panel"
        controls={mockControls}
        values={mockValues}
      />
    );

    const rangeInput = screen.getByLabelText('Range Control');
    expect(rangeInput).toHaveAttribute('type', 'range');
    expect(rangeInput).toHaveAttribute('min', '0');
    expect(rangeInput).toHaveAttribute('max', '100');
    expect(rangeInput).toHaveAttribute('step', '1');
    expect(rangeInput).toHaveValue('50');
  });

  it('renders select input with correct options', () => {
    render(
      <BaseControlPanel
        title="Test Panel"
        controls={mockControls}
        values={mockValues}
      />
    );

    const selectInput = screen.getByLabelText('Select Control');
    const options = Array.from(selectInput.options);
    expect(options).toHaveLength(2);
    expect(options[0].text).toBe('Option 1');
    expect(options[1].text).toBe('Option 2');
  });

  it('calls onChange when range value changes', () => {
    const onChange = jest.fn();
    render(
      <BaseControlPanel
        title="Test Panel"
        controls={mockControls}
        values={mockValues}
        onChange={onChange}
      />
    );

    const rangeInput = screen.getByLabelText('Range Control');
    fireEvent.change(rangeInput, { target: { value: '75' } });

    expect(onChange).toHaveBeenCalledWith({
      ...mockValues,
      range1: 75,
    });
  });

  it('calls onChange when select value changes', () => {
    const onChange = jest.fn();
    render(
      <BaseControlPanel
        title="Test Panel"
        controls={mockControls}
        values={mockValues}
        onChange={onChange}
      />
    );

    const selectInput = screen.getByLabelText('Select Control');
    fireEvent.change(selectInput, { target: { value: 'option2' } });

    expect(onChange).toHaveBeenCalledWith({
      ...mockValues,
      select1: 'option2',
    });
  });

  it('renders info items when provided', () => {
    render(
      <BaseControlPanel
        title="Test Panel"
        controls={mockControls}
        values={mockValues}
        infoItems={mockInfoItems}
      />
    );

    expect(screen.getByText('Info 1')).toBeInTheDocument();
    expect(screen.getByText('Info 2')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <BaseControlPanel
        title="Test Panel"
        controls={mockControls}
        values={mockValues}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('base-control-panel custom-class');
  });

  it('displays unit when provided for range control', () => {
    const controlsWithUnit = [
      {
        ...mockControls[0],
        unit: 'px',
      },
    ];

    render(
      <BaseControlPanel
        title="Test Panel"
        controls={controlsWithUnit}
        values={mockValues}
      />
    );

    expect(screen.getByText('50 px')).toBeInTheDocument();
  });
});
