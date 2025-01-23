import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createMockUniverse,
  createMockUser,
  mockApiResponse,
  renderWithProviders,
} from '../../../tests/utils/testUtils';
import UniverseDetail from '../UniverseDetail';

describe('UniverseDetail Component', () => {
  const mockUniverse = createMockUniverse();
  const mockUser = createMockUser();

  beforeEach(() => {
    // Reset fetch mock
    fetch.mockReset();
  });

  it('renders loading state initially', () => {
    renderWithProviders(<UniverseDetail universeId={mockUniverse.id} />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders universe details after loading', async () => {
    // Mock API response
    fetch.mockResolvedValueOnce(mockApiResponse({ universe: mockUniverse }));

    renderWithProviders(<UniverseDetail universeId={mockUniverse.id} />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Check if universe details are rendered
    expect(screen.getByText(mockUniverse.name)).toBeInTheDocument();
    expect(screen.getByText(mockUniverse.description)).toBeInTheDocument();
  });

  it('handles error state', async () => {
    // Mock API error
    fetch.mockRejectedValueOnce(new Error('Failed to fetch universe'));

    renderWithProviders(<UniverseDetail universeId={mockUniverse.id} />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('allows editing universe details when user is owner', async () => {
    const user = userEvent.setup();

    // Mock API responses
    fetch.mockResolvedValueOnce(
      mockApiResponse({
        universe: { ...mockUniverse, ownerId: mockUser.id },
      })
    );

    renderWithProviders(<UniverseDetail universeId={mockUniverse.id} />, {
      preloadedState: {
        auth: { user: mockUser, isAuthenticated: true },
      },
    });

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    // Check if edit form is displayed
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('updates physics parameters', async () => {
    const user = userEvent.setup();

    // Mock API responses
    fetch.mockResolvedValueOnce(mockApiResponse({ universe: mockUniverse }));

    renderWithProviders(<UniverseDetail universeId={mockUniverse.id} />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Find physics controls
    const gravitySlider = screen.getByLabelText(/gravity/i);
    await user.type(gravitySlider, '5.0');

    // Check if value is updated
    expect(gravitySlider).toHaveValue('5.0');
  });

  it('plays and pauses audio', async () => {
    const user = userEvent.setup();

    // Mock API responses
    fetch.mockResolvedValueOnce(mockApiResponse({ universe: mockUniverse }));

    renderWithProviders(<UniverseDetail universeId={mockUniverse.id} />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Find play button
    const playButton = screen.getByRole('button', { name: /play/i });
    await user.click(playButton);

    // Check if audio is playing
    expect(playButton).toHaveAttribute('aria-label', 'Pause');

    // Click again to pause
    await user.click(playButton);
    expect(playButton).toHaveAttribute('aria-label', 'Play');
  });

  it('shows comments section', async () => {
    // Mock API responses
    const mockComments = [
      { id: 1, text: 'Great universe!', user: createMockUser() },
      { id: 2, text: 'Amazing work', user: createMockUser() },
    ];

    fetch.mockResolvedValueOnce(mockApiResponse({ universe: mockUniverse }));
    fetch.mockResolvedValueOnce(mockApiResponse({ comments: mockComments }));

    renderWithProviders(<UniverseDetail universeId={mockUniverse.id} />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Check if comments are displayed
    expect(screen.getByText('Great universe!')).toBeInTheDocument();
    expect(screen.getByText('Amazing work')).toBeInTheDocument();
  });

  it('allows adding new comments when authenticated', async () => {
    const user = userEvent.setup();

    // Mock API responses
    fetch.mockResolvedValueOnce(mockApiResponse({ universe: mockUniverse }));
    fetch.mockResolvedValueOnce(mockApiResponse({ comments: [] }));

    renderWithProviders(<UniverseDetail universeId={mockUniverse.id} />, {
      preloadedState: {
        auth: { user: mockUser, isAuthenticated: true },
      },
    });

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Add new comment
    const commentInput = screen.getByPlaceholderText(/add a comment/i);
    await user.type(commentInput, 'New comment');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Check if comment is added
    expect(screen.getByText('New comment')).toBeInTheDocument();
  });
});
