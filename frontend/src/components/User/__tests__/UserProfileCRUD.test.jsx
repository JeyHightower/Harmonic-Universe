import { fireEvent, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { userService } from '../../../services/userService';
import { renderWithProviders } from '../../../utils/test-utils';
import UserProfile from '../UserProfile';

// Mock the user service
vi.mock('../../../services/userService', () => ({
  userService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    deleteProfile: vi.fn(),
    uploadAvatar: vi.fn(),
  },
}));

describe('User Profile CRUD Operations', () => {
  const mockProfile = {
    id: 1,
    displayName: 'Test User',
    bio: 'A test user bio',
    avatar: 'test-avatar.jpg',
    email: 'test@example.com',
    settings: {
      profileVisibility: 'public',
      activityVisibility: 'friends',
    },
  };

  describe('Create User Profile', () => {
    it('should create new user profile', async () => {
      const mockCreate = vi.fn().mockResolvedValue({ data: mockProfile });
      userService.updateProfile.mockImplementation(mockCreate);

      renderWithProviders(<UserProfile />);

      // Fill profile form
      fireEvent.change(screen.getByLabelText(/display name/i), {
        target: { value: 'Test User' },
      });
      fireEvent.change(screen.getByLabelText(/bio/i), {
        target: { value: 'A test user bio' },
      });

      // Mock file upload
      const file = new File(['test'], 'test-avatar.jpg', {
        type: 'image/jpeg',
      });
      const fileInput = screen.getByTestId('avatar-upload');
      Object.defineProperty(fileInput, 'files', {
        value: [file],
      });
      fireEvent.change(fileInput);

      // Save profile
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            displayName: 'Test User',
            bio: 'A test user bio',
          })
        );
      });
    });

    it('should show error on creation failure', async () => {
      userService.updateProfile.mockRejectedValue(new Error('Creation failed'));

      renderWithProviders(<UserProfile />);

      fireEvent.change(screen.getByLabelText(/display name/i), {
        target: { value: 'Test User' },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText(/Creation failed/i)).toBeInTheDocument();
      });
    });

    it('should validate required fields', () => {
      renderWithProviders(<UserProfile />);

      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      expect(screen.getByText(/Display name is required/i)).toBeInTheDocument();
    });
  });

  describe('Read User Profile', () => {
    it('should display user profile', async () => {
      userService.getProfile.mockResolvedValue({
        data: mockProfile,
      });

      renderWithProviders(<UserProfile userId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('A test user bio')).toBeInTheDocument();
        expect(screen.getByAltText('Profile avatar')).toHaveAttribute(
          'src',
          'test-avatar.jpg'
        );
      });
    });

    it('should show loading state', () => {
      renderWithProviders(<UserProfile userId={1} />);
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });
  });

  describe('Update User Profile', () => {
    it('should update profile details', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({
        data: { ...mockProfile, displayName: 'Updated User' },
      });
      userService.updateProfile.mockImplementation(mockUpdate);

      renderWithProviders(<UserProfile profile={mockProfile} />);

      fireEvent.change(screen.getByLabelText(/display name/i), {
        target: { value: 'Updated User' },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            displayName: 'Updated User',
          })
        );
      });
    });

    it('should handle update errors', async () => {
      userService.updateProfile.mockRejectedValue(new Error('Update failed'));

      renderWithProviders(<UserProfile profile={mockProfile} />);

      fireEvent.change(screen.getByLabelText(/display name/i), {
        target: { value: 'a' }, // Too short
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/Display name must be at least 2 characters/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Delete User Profile', () => {
    it('should delete profile', async () => {
      const mockDelete = vi.fn().mockResolvedValue({ success: true });
      userService.deleteProfile.mockImplementation(mockDelete);

      renderWithProviders(<UserProfile profile={mockProfile} />);

      fireEvent.click(screen.getByRole('button', { name: /delete/i }));
      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith(1);
      });
    });

    it('should show confirmation before deletion', () => {
      renderWithProviders(<UserProfile profile={mockProfile} />);

      fireEvent.click(screen.getByRole('button', { name: /delete/i }));
      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    });
  });

  describe('Profile Privacy Settings', () => {
    it('should update privacy settings', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({
        data: {
          ...mockProfile,
          settings: {
            profileVisibility: 'friends',
            activityVisibility: 'private',
          },
        },
      });
      userService.updateProfile.mockImplementation(mockUpdate);

      renderWithProviders(<UserProfile profile={mockProfile} />);

      fireEvent.change(screen.getByLabelText(/profile visibility/i), {
        target: { value: 'friends' },
      });
      fireEvent.change(screen.getByLabelText(/activity visibility/i), {
        target: { value: 'private' },
      });
      fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            settings: {
              profileVisibility: 'friends',
              activityVisibility: 'private',
            },
          })
        );
      });
    });
  });
});
