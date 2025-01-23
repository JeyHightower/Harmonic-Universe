import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Profile } from '../../components/Profile';
import {
    deleteAccount,
    updateAvatar,
    updateProfile
} from '../../store/slices/profileSlice';

const mockStore = configureStore([thunk]);

describe('Profile Management', () => {
  let store;
  const mockUser = {
    id: '123',
    username: 'testuser',
    email: 'test@example.com',
    bio: 'Test bio',
    avatarUrl: 'https://example.com/avatar.jpg',
    createdAt: new Date().toISOString()
  };

  beforeEach(() => {
    store = mockStore({
      profile: {
        user: mockUser,
        loading: false,
        error: null
      }
    });
  });

  test('renders profile information', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(mockUser.username)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    expect(screen.getByText(mockUser.bio)).toBeInTheDocument();
    expect(screen.getByAltText('profile avatar')).toHaveAttribute('src', mockUser.avatarUrl);
  });

  test('handles profile update', async () => {
    const updatedProfile = {
      ...mockUser,
      username: 'newusername',
      bio: 'Updated bio'
    };
    store.dispatch = jest.fn().mockResolvedValue({ payload: updatedProfile });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      </Provider>
    );

    fireEvent.click(screen.getByText(/edit profile/i));

    const usernameInput = screen.getByLabelText(/username/i);
    const bioInput = screen.getByLabelText(/bio/i);

    fireEvent.change(usernameInput, { target: { value: updatedProfile.username } });
    fireEvent.change(bioInput, { target: { value: updatedProfile.bio } });

    fireEvent.click(screen.getByText(/save changes/i));

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        updateProfile({
          username: updatedProfile.username,
          bio: updatedProfile.bio
        })
      );
    });
  });

  test('handles avatar update', async () => {
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    store.dispatch = jest.fn().mockResolvedValue({
      payload: { ...mockUser, avatarUrl: 'https://example.com/new-avatar.jpg' }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      </Provider>
    );

    const fileInput = screen.getByLabelText(/change avatar/i);
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: updateAvatar.type,
          payload: expect.any(FormData)
        })
      );
    });
  });

  test('handles account deletion', async () => {
    store.dispatch = jest.fn().mockResolvedValue({ payload: null });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      </Provider>
    );

    fireEvent.click(screen.getByText(/delete account/i));
    fireEvent.click(screen.getByText(/confirm deletion/i));

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(deleteAccount());
    });
  });

  test('displays validation errors', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      </Provider>
    );

    fireEvent.click(screen.getByText(/edit profile/i));

    const usernameInput = screen.getByLabelText(/username/i);
    fireEvent.change(usernameInput, { target: { value: '' } });

    fireEvent.click(screen.getByText(/save changes/i));

    expect(screen.getByText(/username is required/i)).toBeInTheDocument();
  });

  test('displays error message', () => {
    const error = 'Failed to update profile';
    store = mockStore({
      profile: {
        user: mockUser,
        loading: false,
        error
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(error)).toBeInTheDocument();
  });

  test('displays loading state', () => {
    store = mockStore({
      profile: {
        user: mockUser,
        loading: true,
        error: null
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
