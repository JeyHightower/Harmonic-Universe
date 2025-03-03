import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import PhysicsConstraintModal from '../PhysicsConstraintModal';

// Mock fetch globally
global.fetch = jest.fn();

// Mock the Modal component
jest.mock('../../../components/common/Modal', () => {
  return ({ children, title, onClose }) => (
    <div data-testid="modal" aria-label={title}>
      <h2>{title || 'Modal Title'}</h2>
      <button data-testid="close-button" onClick={onClose}>
        Close
      </button>
      <div>{children}</div>
    </div>
  );
});

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('PhysicsConstraintModal Component', () => {
  const mockSceneId = 'scene-123';
  const mockConstraintId = 'constraint-456';

  const mockOnClose = jest.fn();

  const defaultProps = {
    sceneId: mockSceneId,
    onClose: mockOnClose,
  };

  const mockPhysicsObjects = [
    { id: 'object-1', name: 'Object 1' },
    { id: 'object-2', name: 'Object 2' },
    { id: 'object-3', name: 'Object 3' },
  ];

  const mockConstraintData = {
    id: mockConstraintId,
    name: 'Test Constraint',
    type: 'DISTANCE',
    object1_id: 'object-1',
    object2_id: 'object-2',
    parameters: {
      stiffness: 75,
      damping: 0.8,
      restLength: 150,
      breakForce: 2000,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful fetch responses
    global.fetch.mockImplementation(url => {
      if (url.includes(`/physics-constraints/${mockConstraintId}`)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockConstraintData),
        });
      }

      if (url.includes('/physics-objects')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPhysicsObjects),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'new-constraint-id' }),
      });
    });
  });

  test('renders create form with default values', async () => {
    render(
      <MemoryRouter>
        <PhysicsConstraintModal {...defaultProps} />
      </MemoryRouter>
    );

    // Wait for physics objects to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first object/i)).toBeInTheDocument();
    });

    // Check that the modal title is correct
    expect(screen.getByText('Create Physics Constraint')).toBeInTheDocument();

    // Check that form fields are rendered with default values
    expect(screen.getByLabelText(/constraint name/i)).toHaveValue('');
    expect(screen.getByLabelText(/constraint type/i)).toHaveValue('SPRING');
    expect(screen.getByLabelText(/first object/i)).toHaveValue('');
    expect(screen.getByLabelText(/second object/i)).toHaveValue('');

    // Check that parameter fields are rendered
    expect(screen.getByLabelText(/stiffness/i)).toHaveValue(50);
    expect(screen.getByLabelText(/damping/i)).toHaveValue(0.5);
    expect(screen.getByLabelText(/rest length/i)).toHaveValue(100);
    expect(screen.getByLabelText(/break force/i)).toHaveValue(1000);

    // Check that buttons are rendered
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create constraint/i })
    ).toBeInTheDocument();
  });

  test('renders loading state when fetching constraint data', () => {
    render(
      <MemoryRouter>
        <PhysicsConstraintModal
          {...defaultProps}
          initialData={{ id: mockConstraintId }}
        />
      </MemoryRouter>
    );

    // Check that loading spinner is shown
    expect(screen.getByText(/loading constraint data/i)).toBeInTheDocument();
  });

  test('renders edit form with fetched data', async () => {
    render(
      <MemoryRouter>
        <PhysicsConstraintModal
          {...defaultProps}
          initialData={{ id: mockConstraintId }}
        />
      </MemoryRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(
        screen.queryByText(/loading constraint data/i)
      ).not.toBeInTheDocument();
    });

    // Check that the modal title is correct for editing
    expect(screen.getByText('Edit Physics Constraint')).toBeInTheDocument();

    // Check that form fields are populated with fetched data
    expect(screen.getByLabelText(/constraint name/i)).toHaveValue(
      'Test Constraint'
    );
    expect(screen.getByLabelText(/constraint type/i)).toHaveValue('DISTANCE');

    // Check that object selections are populated
    expect(screen.getByLabelText(/first object/i)).toHaveValue('object-1');
    expect(screen.getByLabelText(/second object/i)).toHaveValue('object-2');

    // Check that parameters are populated
    expect(screen.getByLabelText(/rest length/i)).toHaveValue(150);
    expect(screen.getByLabelText(/break force/i)).toHaveValue(2000);

    // Check that the save button is rendered
    expect(
      screen.getByRole('button', { name: /save changes/i })
    ).toBeInTheDocument();
  });

  test('shows warning when there are not enough physics objects', async () => {
    // Mock fetch to return empty array
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );

    render(
      <MemoryRouter>
        <PhysicsConstraintModal {...defaultProps} />
      </MemoryRouter>
    );

    // Wait for warning message
    await waitFor(() => {
      expect(
        screen.getByText(/you need at least two physics objects/i)
      ).toBeInTheDocument();
    });

    // Form should not be rendered
    expect(screen.queryByLabelText(/constraint name/i)).not.toBeInTheDocument();
  });

  test('shows error message when fetching physics objects fails', async () => {
    // Mock fetch to return an error
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Failed to fetch' }),
      })
    );

    render(
      <MemoryRouter>
        <PhysicsConstraintModal {...defaultProps} />
      </MemoryRouter>
    );

    // Wait for error message
    await waitFor(() => {
      expect(
        screen.getByText(/failed to fetch physics objects/i)
      ).toBeInTheDocument();
    });
  });

  test('updates form values when inputs change', async () => {
    render(
      <MemoryRouter>
        <PhysicsConstraintModal {...defaultProps} />
      </MemoryRouter>
    );

    // Wait for physics objects to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first object/i)).toBeInTheDocument();
    });

    // Change name
    await userEvent.type(
      screen.getByLabelText(/constraint name/i),
      'New Constraint'
    );
    expect(screen.getByLabelText(/constraint name/i)).toHaveValue(
      'New Constraint'
    );

    // Change type
    await userEvent.selectOptions(
      screen.getByLabelText(/constraint type/i),
      'HINGE'
    );
    expect(screen.getByLabelText(/constraint type/i)).toHaveValue('HINGE');

    // Select objects
    await userEvent.selectOptions(
      screen.getByLabelText(/first object/i),
      'object-1'
    );
    expect(screen.getByLabelText(/first object/i)).toHaveValue('object-1');

    await userEvent.selectOptions(
      screen.getByLabelText(/second object/i),
      'object-2'
    );
    expect(screen.getByLabelText(/second object/i)).toHaveValue('object-2');

    // Change parameters
    await userEvent.clear(screen.getByLabelText(/rest length/i));
    await userEvent.type(screen.getByLabelText(/rest length/i), '200');
    expect(screen.getByLabelText(/rest length/i)).toHaveValue(200);

    await userEvent.clear(screen.getByLabelText(/break force/i));
    await userEvent.type(screen.getByLabelText(/break force/i), '3000');
    expect(screen.getByLabelText(/break force/i)).toHaveValue(3000);
  });

  test('shows different parameters based on constraint type', async () => {
    render(
      <MemoryRouter>
        <PhysicsConstraintModal {...defaultProps} />
      </MemoryRouter>
    );

    // Wait for physics objects to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first object/i)).toBeInTheDocument();
    });

    // Initially should show spring parameters
    expect(screen.getByLabelText(/stiffness/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/damping/i)).toBeInTheDocument();

    // Change type to DISTANCE
    await userEvent.selectOptions(
      screen.getByLabelText(/constraint type/i),
      'DISTANCE'
    );

    // Should no longer show spring-specific parameters
    expect(screen.queryByLabelText(/stiffness/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/damping/i)).not.toBeInTheDocument();

    // But should still show common parameters
    expect(screen.getByLabelText(/rest length/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/break force/i)).toBeInTheDocument();
  });

  test('validates that two different objects are selected', async () => {
    render(
      <MemoryRouter>
        <PhysicsConstraintModal {...defaultProps} />
      </MemoryRouter>
    );

    // Wait for physics objects to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first object/i)).toBeInTheDocument();
    });

    // Fill in required fields
    await userEvent.type(
      screen.getByLabelText(/constraint name/i),
      'Test Constraint'
    );

    // Select the same object for both dropdowns
    await userEvent.selectOptions(
      screen.getByLabelText(/first object/i),
      'object-1'
    );
    await userEvent.selectOptions(
      screen.getByLabelText(/second object/i),
      'object-1'
    );

    // Submit form
    await userEvent.click(
      screen.getByRole('button', { name: /create constraint/i })
    );

    // Should show validation error
    await waitFor(() => {
      expect(
        screen.getByText(/must connect two different objects/i)
      ).toBeInTheDocument();
    });

    // Should not have made a fetch request
    expect(global.fetch).not.toHaveBeenCalledWith(
      '/api/v1/physics-constraints',
      expect.anything()
    );
  });

  test('submits form data when create button is clicked', async () => {
    render(
      <MemoryRouter>
        <PhysicsConstraintModal {...defaultProps} />
      </MemoryRouter>
    );

    // Wait for physics objects to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first object/i)).toBeInTheDocument();
    });

    // Fill in required fields
    await userEvent.type(
      screen.getByLabelText(/constraint name/i),
      'New Constraint'
    );
    await userEvent.selectOptions(
      screen.getByLabelText(/first object/i),
      'object-1'
    );
    await userEvent.selectOptions(
      screen.getByLabelText(/second object/i),
      'object-2'
    );

    // Submit form
    await userEvent.click(
      screen.getByRole('button', { name: /create constraint/i })
    );

    // Check that fetch was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/physics-constraints',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('"name":"New Constraint"'),
        })
      );
    });

    // Check that the body contains the scene ID and object IDs
    const fetchCall = global.fetch.mock.calls[1]; // Second call (first was to fetch physics objects)
    const requestBody = JSON.parse(fetchCall[1].body);
    expect(requestBody.scene_id).toBe(mockSceneId);
    expect(requestBody.object1_id).toBe('object-1');
    expect(requestBody.object2_id).toBe('object-2');

    // Check that onClose was called
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('submits form data when save button is clicked in edit mode', async () => {
    render(
      <MemoryRouter>
        <PhysicsConstraintModal
          {...defaultProps}
          initialData={{ id: mockConstraintId }}
        />
      </MemoryRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(
        screen.queryByText(/loading constraint data/i)
      ).not.toBeInTheDocument();
    });

    // Change name
    await userEvent.clear(screen.getByLabelText(/constraint name/i));
    await userEvent.type(
      screen.getByLabelText(/constraint name/i),
      'Updated Constraint'
    );

    // Submit form
    await userEvent.click(
      screen.getByRole('button', { name: /save changes/i })
    );

    // Check that fetch was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/v1/physics-constraints/${mockConstraintId}`,
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('"name":"Updated Constraint"'),
        })
      );
    });

    // Check that onClose was called
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('shows error message when form submission fails', async () => {
    // Mock fetch to return an error on POST
    global.fetch.mockImplementation(url => {
      if (url.includes('/physics-objects')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPhysicsObjects),
        });
      }

      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Validation failed' }),
      });
    });

    render(
      <MemoryRouter>
        <PhysicsConstraintModal {...defaultProps} />
      </MemoryRouter>
    );

    // Wait for physics objects to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first object/i)).toBeInTheDocument();
    });

    // Fill in required fields
    await userEvent.type(
      screen.getByLabelText(/constraint name/i),
      'New Constraint'
    );
    await userEvent.selectOptions(
      screen.getByLabelText(/first object/i),
      'object-1'
    );
    await userEvent.selectOptions(
      screen.getByLabelText(/second object/i),
      'object-2'
    );

    // Submit form
    await userEvent.click(
      screen.getByRole('button', { name: /create constraint/i })
    );

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/validation failed/i)).toBeInTheDocument();
    });

    // Check that onClose was not called
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('closes modal when cancel button is clicked', async () => {
    render(
      <MemoryRouter>
        <PhysicsConstraintModal {...defaultProps} />
      </MemoryRouter>
    );

    // Wait for physics objects to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first object/i)).toBeInTheDocument();
    });

    // Click cancel button
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    // Check that onClose was called
    expect(mockOnClose).toHaveBeenCalled();
  });
});
