import { fireEvent, screen, waitFor } from '@testing-library/react';
import * as storyboardService from '../../../services/storyboardService';
import { createMockApiResponse, createMockErrorResponse, createMockStoryboard, render } from '../../../test-utils';
import StoryboardCreate from '../StoryboardCreate';

// Mock the storyboard service
jest.mock('../../../services/storyboardService');

describe('StoryboardCreate Component', () => {
  const mockUniverseId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders storyboard creation form correctly', () => {
    render(<StoryboardCreate universeId={mockUniverseId} />);

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  it('handles successful storyboard creation', async () => {
    const mockStoryboard = createMockStoryboard();
    const mockResponse = createMockApiResponse(mockStoryboard);
    storyboardService.createStoryboard.mockResolvedValueOnce(mockResponse);

    render(<StoryboardCreate universeId={mockUniverseId} />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Storyboard' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Test Description' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(storyboardService.createStoryboard).toHaveBeenCalledWith(
        mockUniverseId,
        {
          title: 'Test Storyboard',
          description: 'Test Description',
          metadata: {},
        }
      );
    });
  });

  it('displays error message on creation failure', async () => {
    const mockError = createMockErrorResponse(400, 'Storyboard creation failed');
    storyboardService.createStoryboard.mockRejectedValueOnce(mockError);

    render(<StoryboardCreate universeId={mockUniverseId} />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Storyboard' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText(/storyboard creation failed/i)).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    render(<StoryboardCreate universeId={mockUniverseId} />);

    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  it('handles metadata input', async () => {
    const mockStoryboard = createMockStoryboard();
    const mockResponse = createMockApiResponse(mockStoryboard);
    storyboardService.createStoryboard.mockResolvedValueOnce(mockResponse);

    render(<StoryboardCreate universeId={mockUniverseId} />);

    // Fill in basic info
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Storyboard' },
    });

    // Fill in metadata
    fireEvent.change(screen.getByLabelText(/tags/i), {
      target: { value: 'tag1, tag2' },
    });
    fireEvent.change(screen.getByLabelText(/genre/i), {
      target: { value: 'fantasy' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(storyboardService.createStoryboard).toHaveBeenCalledWith(
        mockUniverseId,
        expect.objectContaining({
          metadata: {
            tags: ['tag1', 'tag2'],
            genre: 'fantasy',
          },
        })
      );
    });
  });

  it('disables submit button while loading', async () => {
    storyboardService.createStoryboard.mockImplementationOnce(() => new Promise(() => {}));

    render(<StoryboardCreate universeId={mockUniverseId} />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Storyboard' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create/i })).toBeDisabled();
    });
  });

  it('resets form after successful creation', async () => {
    const mockStoryboard = createMockStoryboard();
    const mockResponse = createMockApiResponse(mockStoryboard);
    storyboardService.createStoryboard.mockResolvedValueOnce(mockResponse);

    render(<StoryboardCreate universeId={mockUniverseId} />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Storyboard' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Test Description' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveValue('');
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
    });
  });

  it('handles onSuccess callback', async () => {
    const mockStoryboard = createMockStoryboard();
    const mockResponse = createMockApiResponse(mockStoryboard);
    const onSuccess = jest.fn();
    storyboardService.createStoryboard.mockResolvedValueOnce(mockResponse);

    render(<StoryboardCreate universeId={mockUniverseId} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Storyboard' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockStoryboard);
    });
  });
});
