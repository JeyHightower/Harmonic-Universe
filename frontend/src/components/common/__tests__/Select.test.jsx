import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Select from '../Select';

describe('Select Component', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  const defaultProps = {
    id: 'test-select',
    value: '',
    onChange: jest.fn(),
    options,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with default props', () => {
    render(<Select {...defaultProps} />);

    // Check that the select control exists
    const selectControl = screen.getByRole('combobox');
    expect(selectControl).toBeInTheDocument();
    expect(selectControl).toHaveAttribute('id', 'test-select');

    // Should show placeholder by default
    expect(screen.getByText('Select an option')).toBeInTheDocument();

    // Dropdown should be closed initially
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('renders with selected value', () => {
    render(<Select {...defaultProps} value="option2" />);

    // Should show the selected option label
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  test('opens dropdown when clicked', async () => {
    render(<Select {...defaultProps} />);

    const selectControl = screen.getByRole('combobox');

    // Click to open dropdown
    await userEvent.click(selectControl);

    // Dropdown should be open
    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();

    // All options should be visible
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  test('selects an option when clicked', async () => {
    render(<Select {...defaultProps} />);

    // Open dropdown
    await userEvent.click(screen.getByRole('combobox'));

    // Click an option
    await userEvent.click(screen.getByText('Option 2'));

    // Should call onChange with the selected value
    expect(defaultProps.onChange).toHaveBeenCalledWith('option2');

    // Dropdown should close after selection
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('closes dropdown when clicking outside', async () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <Select {...defaultProps} />
      </div>
    );

    // Open dropdown
    await userEvent.click(screen.getByRole('combobox'));

    // Dropdown should be open
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Click outside
    await userEvent.click(screen.getByTestId('outside'));

    // Dropdown should close
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('handles keyboard navigation', async () => {
    render(<Select {...defaultProps} />);

    const selectControl = screen.getByRole('combobox');

    // Focus the select
    selectControl.focus();

    // Press Enter to open dropdown
    fireEvent.keyDown(selectControl, { key: 'Enter' });

    // Dropdown should be open
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Press Escape to close dropdown
    fireEvent.keyDown(selectControl, { key: 'Escape' });

    // Dropdown should close
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    // Press ArrowDown to open dropdown
    fireEvent.keyDown(selectControl, { key: 'ArrowDown' });

    // Dropdown should be open again
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  test('disables select when disabled prop is true', async () => {
    render(<Select {...defaultProps} disabled={true} />);

    const selectControl = screen.getByRole('combobox');

    // Select should have disabled class
    expect(selectControl.closest('.select-container')).toHaveClass('disabled');

    // Click should not open dropdown
    await userEvent.click(selectControl);

    // Dropdown should remain closed
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('renders with custom placeholder', () => {
    render(<Select {...defaultProps} placeholder="Choose an option" />);

    // Should show custom placeholder
    expect(screen.getByText('Choose an option')).toBeInTheDocument();
  });

  test('renders with searchable dropdown', async () => {
    render(<Select {...defaultProps} searchable={true} />);

    // Open dropdown
    await userEvent.click(screen.getByRole('combobox'));

    // Search input should be visible
    const searchInput = screen.getByPlaceholderText('Search...');
    expect(searchInput).toBeInTheDocument();

    // Type in search input
    await userEvent.type(searchInput, 'Option 1');

    // Only matching option should be visible
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Option 3')).not.toBeInTheDocument();
  });

  test('shows no options message when search has no results', async () => {
    render(<Select {...defaultProps} searchable={true} />);

    // Open dropdown
    await userEvent.click(screen.getByRole('combobox'));

    // Type in search input
    await userEvent.type(screen.getByPlaceholderText('Search...'), 'xyz');

    // No options message should be visible
    expect(screen.getByText('No options found')).toBeInTheDocument();
  });

  test('applies custom className', () => {
    render(<Select {...defaultProps} className="custom-class" />);

    // Container should have custom class
    expect(
      screen.getByRole('combobox').closest('.select-container')
    ).toHaveClass('custom-class');
  });
});
