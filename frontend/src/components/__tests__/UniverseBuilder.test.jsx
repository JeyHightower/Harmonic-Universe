import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import UniverseBuilderPage from '../../pages/UniverseBuilderPage';

const mockStore = configureStore([thunk]);

describe('UniverseBuilder Component', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      auth: {
        user: { id: 1, email: 'test@example.com' },
      },
      universe: {
        loading: false,
        error: null,
      },
    });
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <UniverseBuilderPage />
        </BrowserRouter>
      </Provider>
    );
  };

  test('renders all form elements', () => {
    renderComponent();

    // Basic information
    expect(screen.getByLabelText(/universe name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();

    // Physics controls
    expect(screen.getByText(/physics parameters/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gravity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/friction/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/elasticity/i)).toBeInTheDocument();

    // Music controls
    expect(screen.getByText(/music parameters/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/harmony/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tempo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/scale/i)).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    renderComponent();
    const user = userEvent.setup();

    // Try to submit without required fields
    const submitButton = screen.getByText(/create universe/i);
    await user.click(submitButton);

    // Check for validation messages
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });

  test('handles form submission', async () => {
    renderComponent();
    const user = userEvent.setup();

    // Fill out the form
    await user.type(screen.getByLabelText(/universe name/i), 'Test Universe');
    await user.type(screen.getByLabelText(/description/i), 'Test Description');

    // Adjust physics parameters
    const gravitySlider = screen.getByLabelText(/gravity/i);
    await user.click(gravitySlider);
    fireEvent.change(gravitySlider, { target: { value: '5.0' } });

    // Adjust music parameters
    const tempoSlider = screen.getByLabelText(/tempo/i);
    await user.click(tempoSlider);
    fireEvent.change(tempoSlider, { target: { value: '120' } });

    // Submit form
    const submitButton = screen.getByText(/create universe/i);
    await user.click(submitButton);

    // Check if store was called with correct action
    const actions = store.getActions();
    expect(actions[0].type).toBe('universe/createUniverse/pending');
  });

  test('displays loading state during submission', async () => {
    store = mockStore({
      auth: {
        user: { id: 1, email: 'test@example.com' },
      },
      universe: {
        loading: true,
        error: null,
      },
    });

    renderComponent();

    expect(screen.getByText(/creating\.\.\./i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create universe/i })
    ).toBeDisabled();
  });

  test('displays error messages', async () => {
    store = mockStore({
      auth: {
        user: { id: 1, email: 'test@example.com' },
      },
      universe: {
        loading: false,
        error: 'Failed to create universe',
      },
    });

    renderComponent();

    expect(screen.getByText(/failed to create universe/i)).toBeInTheDocument();
  });

  test('handles parameter changes correctly', async () => {
    renderComponent();
    const user = userEvent.setup();

    // Test physics parameter changes
    const gravitySlider = screen.getByLabelText(/gravity/i);
    await user.click(gravitySlider);
    fireEvent.change(gravitySlider, { target: { value: '5.0' } });
    expect(gravitySlider.value).toBe('5.0');

    // Test music parameter changes
    const tempoSlider = screen.getByLabelText(/tempo/i);
    await user.click(tempoSlider);
    fireEvent.change(tempoSlider, { target: { value: '120' } });
    expect(tempoSlider.value).toBe('120');

    const keySelect = screen.getByLabelText(/key/i);
    await user.selectOptions(keySelect, 'G');
    expect(keySelect.value).toBe('G');
  });

  test('is responsive on different screen sizes', () => {
    const { container } = renderComponent();

    // Test mobile view
    window.innerWidth = 375;
    fireEvent.resize(window);
    expect(container.querySelector('.mobile-view')).toBeInTheDocument();

    // Test tablet view
    window.innerWidth = 768;
    fireEvent.resize(window);
    expect(container.querySelector('.tablet-view')).toBeInTheDocument();

    // Test desktop view
    window.innerWidth = 1024;
    fireEvent.resize(window);
    expect(container.querySelector('.desktop-view')).toBeInTheDocument();
  });

  test('provides real-time feedback', async () => {
    renderComponent();
    const user = userEvent.setup();

    // Test invalid universe name
    const nameInput = screen.getByLabelText(/universe name/i);
    await user.type(nameInput, 'a'); // Too short
    expect(screen.getByText(/name must be at least/i)).toBeInTheDocument();

    // Test invalid gravity value
    const gravitySlider = screen.getByLabelText(/gravity/i);
    await user.click(gravitySlider);
    fireEvent.change(gravitySlider, { target: { value: '-1' } });
    expect(screen.getByText(/gravity must be positive/i)).toBeInTheDocument();
  });

  test('maintains form state during navigation', async () => {
    renderComponent();
    const user = userEvent.setup();

    // Fill out form
    await user.type(screen.getByLabelText(/universe name/i), 'Test Universe');
    await user.type(screen.getByLabelText(/description/i), 'Test Description');

    // Simulate navigation away and back
    fireEvent.blur(screen.getByLabelText(/description/i));

    // Check if form state was preserved
    expect(screen.getByLabelText(/universe name/i)).toHaveValue(
      'Test Universe'
    );
    expect(screen.getByLabelText(/description/i)).toHaveValue(
      'Test Description'
    );
  });
});
