import { fireEvent, screen, waitFor } from '@testing-library/react';
import * as mediaEffectService from '../../../services/mediaEffectService';
import * as sceneService from '../../../services/sceneService';
import { createMockApiResponse, createMockErrorResponse, createMockScene, render } from '../../../test-utils';
import SceneEditor from '../SceneEditor';

// Mock the services
jest.mock('../../../services/sceneService');
jest.mock('../../../services/mediaEffectService');

describe('SceneEditor Component', () => {
  const mockStoryboardId = 1;
  const mockScene = createMockScene();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders scene editor correctly', () => {
    render(<SceneEditor storyboardId={mockStoryboardId} scene={mockScene} />);

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sequence/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add visual effect/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add audio track/i })).toBeInTheDocument();
  });

  it('handles scene update', async () => {
    const updatedScene = { ...mockScene, title: 'Updated Scene' };
    const mockResponse = createMockApiResponse(updatedScene);
    sceneService.updateScene.mockResolvedValueOnce(mockResponse);

    render(<SceneEditor storyboardId={mockStoryboardId} scene={mockScene} />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Updated Scene' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(sceneService.updateScene).toHaveBeenCalledWith(
        mockScene.id,
        expect.objectContaining({
          title: 'Updated Scene',
        })
      );
    });
  });

  it('displays error message on update failure', async () => {
    const mockError = createMockErrorResponse(400, 'Scene update failed');
    sceneService.updateScene.mockRejectedValueOnce(mockError);

    render(<SceneEditor storyboardId={mockStoryboardId} scene={mockScene} />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Updated Scene' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/scene update failed/i)).toBeInTheDocument();
    });
  });

  it('handles adding visual effect', async () => {
    const mockEffect = {
      name: 'New Effect',
      effect_type: 'fade',
      parameters: { duration: 2.0 },
    };
    const mockResponse = createMockApiResponse(mockEffect);
    mediaEffectService.createVisualEffect.mockResolvedValueOnce(mockResponse);

    render(<SceneEditor storyboardId={mockStoryboardId} scene={mockScene} />);

    fireEvent.click(screen.getByRole('button', { name: /add visual effect/i }));

    // Fill in effect form
    fireEvent.change(screen.getByLabelText(/effect name/i), {
      target: { value: 'New Effect' },
    });
    fireEvent.change(screen.getByLabelText(/effect type/i), {
      target: { value: 'fade' },
    });
    fireEvent.change(screen.getByLabelText(/duration/i), {
      target: { value: '2.0' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add effect/i }));

    await waitFor(() => {
      expect(mediaEffectService.createVisualEffect).toHaveBeenCalledWith(
        mockScene.id,
        expect.objectContaining(mockEffect)
      );
    });
  });

  it('handles adding audio track', async () => {
    const mockTrack = {
      name: 'New Track',
      track_type: 'background',
      parameters: { volume: 0.8 },
    };
    const mockResponse = createMockApiResponse(mockTrack);
    mediaEffectService.createAudioTrack.mockResolvedValueOnce(mockResponse);

    render(<SceneEditor storyboardId={mockStoryboardId} scene={mockScene} />);

    fireEvent.click(screen.getByRole('button', { name: /add audio track/i }));

    // Fill in track form
    fireEvent.change(screen.getByLabelText(/track name/i), {
      target: { value: 'New Track' },
    });
    fireEvent.change(screen.getByLabelText(/track type/i), {
      target: { value: 'background' },
    });
    fireEvent.change(screen.getByLabelText(/volume/i), {
      target: { value: '0.8' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add track/i }));

    await waitFor(() => {
      expect(mediaEffectService.createAudioTrack).toHaveBeenCalledWith(
        mockScene.id,
        expect.objectContaining(mockTrack)
      );
    });
  });

  it('validates scene sequence number', async () => {
    render(<SceneEditor storyboardId={mockStoryboardId} scene={mockScene} />);

    fireEvent.change(screen.getByLabelText(/sequence/i), {
      target: { value: '-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/sequence must be positive/i)).toBeInTheDocument();
    });
  });

  it('handles effect parameter validation', async () => {
    render(<SceneEditor storyboardId={mockStoryboardId} scene={mockScene} />);

    fireEvent.click(screen.getByRole('button', { name: /add visual effect/i }));

    // Try to add effect without required parameters
    fireEvent.change(screen.getByLabelText(/effect name/i), {
      target: { value: 'New Effect' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add effect/i }));

    await waitFor(() => {
      expect(screen.getByText(/effect type is required/i)).toBeInTheDocument();
    });
  });

  it('handles audio track parameter validation', async () => {
    render(<SceneEditor storyboardId={mockStoryboardId} scene={mockScene} />);

    fireEvent.click(screen.getByRole('button', { name: /add audio track/i }));

    // Try to add track without required parameters
    fireEvent.change(screen.getByLabelText(/track name/i), {
      target: { value: 'New Track' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add track/i }));

    await waitFor(() => {
      expect(screen.getByText(/track type is required/i)).toBeInTheDocument();
    });
  });

  it('disables save button while saving', async () => {
    sceneService.updateScene.mockImplementationOnce(() => new Promise(() => {}));

    render(<SceneEditor storyboardId={mockStoryboardId} scene={mockScene} />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Updated Scene' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    });
  });

  it('handles onSave callback', async () => {
    const updatedScene = { ...mockScene, title: 'Updated Scene' };
    const mockResponse = createMockApiResponse(updatedScene);
    const onSave = jest.fn();
    sceneService.updateScene.mockResolvedValueOnce(mockResponse);

    render(
      <SceneEditor
        storyboardId={mockStoryboardId}
        scene={mockScene}
        onSave={onSave}
      />
    );

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Updated Scene' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(updatedScene);
    });
  });
});
