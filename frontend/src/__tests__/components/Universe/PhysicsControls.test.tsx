import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { ThemeProvider } from 'styled-components';
import { PhysicsControls } from '../../../components/Universe/PhysicsControls';
import { theme } from '../../../theme';

const defaultParameters = {
  gravity: 9.81,
  timeDilation: 1.0,
  spaceCurvature: 0.0,
  fieldStrength: 1.0,
};

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('PhysicsControls', () => {
  it('renders with default parameters', () => {
    const onUpdate = jest.fn();
    renderWithTheme(
      <PhysicsControls parameters={defaultParameters} onUpdate={onUpdate} />
    );

    expect(screen.getByText('Physics Parameters')).toBeInTheDocument();
    expect(screen.getByText('9.81 m/s²')).toBeInTheDocument();
    expect(screen.getByText('1.00x')).toBeInTheDocument();
    expect(screen.getByText('0.00')).toBeInTheDocument();
    expect(screen.getByText('1.00')).toBeInTheDocument();
  });

  it('updates parameters when sliders change', async () => {
    const onUpdate = jest.fn();
    renderWithTheme(
      <PhysicsControls parameters={defaultParameters} onUpdate={onUpdate} />
    );

    const gravitySlider = screen.getByLabelText(/gravity/i) as HTMLInputElement;
    fireEvent.change(gravitySlider, { target: { value: '15.0' } });

    const submitButton = screen.getByText('Apply Changes');
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          gravity: 15.0,
          timeDilation: 1.0,
          spaceCurvature: 0.0,
          fieldStrength: 1.0,
        })
      );
    });
  });

  it('resets parameters when reset button is clicked', () => {
    const onUpdate = jest.fn();
    renderWithTheme(
      <PhysicsControls parameters={defaultParameters} onUpdate={onUpdate} />
    );

    const gravitySlider = screen.getByLabelText(/gravity/i) as HTMLInputElement;
    fireEvent.change(gravitySlider, { target: { value: '15.0' } });

    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);

    expect(screen.getByText('9.81 m/s²')).toBeInTheDocument();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('disables controls when not editable', () => {
    const onUpdate = jest.fn();
    renderWithTheme(
      <PhysicsControls
        parameters={defaultParameters}
        onUpdate={onUpdate}
        isEditable={false}
      />
    );

    const sliders = screen.getAllByRole('slider') as HTMLInputElement[];
    sliders.forEach(slider => {
      expect(slider).toBeDisabled();
    });

    expect(screen.queryByText('Apply Changes')).not.toBeInTheDocument();
    expect(screen.queryByText('Reset')).not.toBeInTheDocument();
  });

  it('shows dirty state when parameters change', () => {
    const onUpdate = jest.fn();
    renderWithTheme(
      <PhysicsControls parameters={defaultParameters} onUpdate={onUpdate} />
    );

    const applyButton = screen.getByText('Apply Changes');
    const resetButton = screen.getByText('Reset');
    expect(applyButton).toBeDisabled();
    expect(resetButton).toBeDisabled();

    const gravitySlider = screen.getByLabelText(/gravity/i) as HTMLInputElement;
    fireEvent.change(gravitySlider, { target: { value: '15.0' } });

    expect(applyButton).not.toBeDisabled();
    expect(resetButton).not.toBeDisabled();
  });

  it('updates local state when parameters prop changes', () => {
    const onUpdate = jest.fn();
    const { rerender } = renderWithTheme(
      <PhysicsControls parameters={defaultParameters} onUpdate={onUpdate} />
    );

    const newParameters = {
      ...defaultParameters,
      gravity: 15.0,
    };

    rerender(
      <ThemeProvider theme={theme}>
        <PhysicsControls parameters={newParameters} onUpdate={onUpdate} />
      </ThemeProvider>
    );

    expect(screen.getByText('15.00 m/s²')).toBeInTheDocument();
  });
});
