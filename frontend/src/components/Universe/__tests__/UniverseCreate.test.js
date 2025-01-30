import { fireEvent, screen, waitFor } from '@testing-library/react';
import * as universeService from '../../../services/universeService';
import { createMockApiResponse, createMockErrorResponse, createMockUniverse, render } from '../../../test-utils';
import UniverseCreate from '../UniverseCreate';

// Mock the universe service
jest.mock('../../../services/universeService');

describe('UniverseCreate Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders universe creation form correctly', () => {
    render(<UniverseCreate />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /public/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  it('handles successful universe creation', async () => {
    const mockUniverse = createMockUniverse();
    const mockResponse = createMockApiResponse(mockUniverse);
    universeService.createUniverse.mockResolvedValueOnce(mockResponse);

    render(<UniverseCreate />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test Universe' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Test Description' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /public/i }));
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(universeService.createUniverse).toHaveBeenCalledWith({
        name: 'Test Universe',
        description: 'Test Description',
        is_public: true,
      });
    });
  });

  it('displays error message on creation failure', async () => {
    const mockError = createMockErrorResponse(400, 'Universe creation failed');
    universeService.createUniverse.mockRejectedValueOnce(mockError);

    render(<UniverseCreate />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test Universe' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText(/universe creation failed/i)).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    render(<UniverseCreate />);

    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it('handles music parameters input', async () => {
    const mockUniverse = createMockUniverse();
    const mockResponse = createMockApiResponse(mockUniverse);
    universeService.createUniverse.mockResolvedValueOnce(mockResponse);

    render(<UniverseCreate />);

    // Fill in basic info
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test Universe' },
    });

    // Fill in music parameters
    fireEvent.change(screen.getByLabelText(/tempo/i), {
      target: { value: '120' },
    });
    fireEvent.change(screen.getByLabelText(/key/i), {
      target: { value: 'C' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(universeService.createUniverse).toHaveBeenCalledWith(
        expect.objectContaining({
          music_parameters: {
            tempo: 120,
            key: 'C',
          },
        })
      );
    });
  });

  it('handles visual parameters input', async () => {
    const mockUniverse = createMockUniverse();
    const mockResponse = createMockApiResponse(mockUniverse);
    universeService.createUniverse.mockResolvedValueOnce(mockResponse);

    render(<UniverseCreate />);

    // Fill in basic info
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test Universe' },
    });

    // Fill in visual parameters
    fireEvent.change(screen.getByLabelText(/theme/i), {
      target: { value: 'dark' },
    });
    fireEvent.change(screen.getByLabelText(/color scheme/i), {
      target: { value: 'blue' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(universeService.createUniverse).toHaveBeenCalledWith(
        expect.objectContaining({
          visual_parameters: {
            theme: 'dark',
            color_scheme: 'blue',
          },
        })
      );
    });
  });

  it('disables submit button while loading', async () => {
    universeService.createUniverse.mockImplementationOnce(() => new Promise(() => {}));

    render(<UniverseCreate />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test Universe' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create/i })).toBeDisabled();
    });
  });

  it('resets form after successful creation', async () => {
    const mockUniverse = createMockUniverse();
    const mockResponse = createMockApiResponse(mockUniverse);
    universeService.createUniverse.mockResolvedValueOnce(mockResponse);

    render(<UniverseCreate />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test Universe' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Test Description' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toHaveValue('');
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
    });
  });
});
