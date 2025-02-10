import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
    CollaborationPanel,
    MediaControls,
    PhysicsControls,
    SceneEditor,
    StoryboardEditor,
    UniverseDetail,
    UniverseList
} from '../components';

const mockStore = configureStore([thunk]);

describe('UniverseList Component', () => {
    let store;

    beforeEach(() => {
        store = mockStore({
            universes: {
                items: [
                    { id: 1, name: 'Test Universe 1', description: 'Test 1' },
                    { id: 2, name: 'Test Universe 2', description: 'Test 2' }
                ],
                loading: false,
                error: null
            }
        });
    });

    test('renders universe list', () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <UniverseList />
                </BrowserRouter>
            </Provider>
        );

        expect(screen.getByText('Test Universe 1')).toBeInTheDocument();
        expect(screen.getByText('Test Universe 2')).toBeInTheDocument();
    });

    test('handles universe selection', () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <UniverseList />
                </BrowserRouter>
            </Provider>
        );

        fireEvent.click(screen.getByText('Test Universe 1'));
        const actions = store.getActions();
        expect(actions).toContainEqual(expect.objectContaining({
            type: 'SELECT_UNIVERSE',
            payload: 1
        }));
    });
});

describe('UniverseDetail Component', () => {
    let store;

    beforeEach(() => {
        store = mockStore({
            universes: {
                selected: {
                    id: 1,
                    name: 'Test Universe',
                    description: 'Test Description',
                    storyboards: []
                },
                loading: false
            }
        });
    });

    test('renders universe details', () => {
        render(
            <Provider store={store}>
                <UniverseDetail universeId={1} />
            </Provider>
        );

        expect(screen.getByText('Test Universe')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    test('handles universe editing', async () => {
        render(
            <Provider store={store}>
                <UniverseDetail universeId={1} />
            </Provider>
        );

        fireEvent.click(screen.getByText('Edit'));
        fireEvent.change(screen.getByLabelText('Name'), {
            target: { value: 'Updated Universe' }
        });
        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            const actions = store.getActions();
            expect(actions).toContainEqual(expect.objectContaining({
                type: 'UPDATE_UNIVERSE',
                payload: expect.objectContaining({
                    name: 'Updated Universe'
                })
            }));
        });
    });
});

describe('StoryboardEditor Component', () => {
    let store;

    beforeEach(() => {
        store = mockStore({
            storyboards: {
                current: {
                    id: 1,
                    name: 'Test Storyboard',
                    scenes: [
                        { id: 1, name: 'Scene 1', sequence: 1 },
                        { id: 2, name: 'Scene 2', sequence: 2 }
                    ]
                }
            }
        });
    });

    test('renders storyboard editor', () => {
        render(
            <Provider store={store}>
                <StoryboardEditor storyboardId={1} />
            </Provider>
        );

        expect(screen.getByText('Test Storyboard')).toBeInTheDocument();
        expect(screen.getByText('Scene 1')).toBeInTheDocument();
        expect(screen.getByText('Scene 2')).toBeInTheDocument();
    });

    test('handles scene reordering', async () => {
        render(
            <Provider store={store}>
                <StoryboardEditor storyboardId={1} />
            </Provider>
        );

        const scene1 = screen.getByText('Scene 1');
        const scene2 = screen.getByText('Scene 2');

        fireEvent.dragStart(scene2);
        fireEvent.dragOver(scene1);
        fireEvent.drop(scene1);

        await waitFor(() => {
            const actions = store.getActions();
            expect(actions).toContainEqual(expect.objectContaining({
                type: 'REORDER_SCENES',
                payload: expect.any(Array)
            }));
        });
    });
});

describe('SceneEditor Component', () => {
    let store;

    beforeEach(() => {
        store = mockStore({
            scenes: {
                current: {
                    id: 1,
                    name: 'Test Scene',
                    content: {},
                    physics_settings: {
                        gravity: { x: 0, y: -9.81 },
                        enabled: true
                    }
                }
            }
        });
    });

    test('renders scene editor', () => {
        render(
            <Provider store={store}>
                <SceneEditor sceneId={1} />
            </Provider>
        );

        expect(screen.getByText('Test Scene')).toBeInTheDocument();
        expect(screen.getByText('Physics Settings')).toBeInTheDocument();
    });

    test('handles physics object creation', async () => {
        render(
            <Provider store={store}>
                <SceneEditor sceneId={1} />
            </Provider>
        );

        fireEvent.click(screen.getByText('Add Object'));
        fireEvent.click(screen.getByText('Circle'));

        await waitFor(() => {
            const actions = store.getActions();
            expect(actions).toContainEqual(expect.objectContaining({
                type: 'CREATE_PHYSICS_OBJECT',
                payload: expect.objectContaining({
                    object_type: 'circle'
                })
            }));
        });
    });
});

describe('PhysicsControls Component', () => {
    test('handles simulation controls', () => {
        const onStart = jest.fn();
        const onStop = jest.fn();
        const onReset = jest.fn();

        render(
            <PhysicsControls
                isRunning={false}
                onStart={onStart}
                onStop={onStop}
                onReset={onReset}
            />
        );

        fireEvent.click(screen.getByText('Start'));
        expect(onStart).toHaveBeenCalled();

        fireEvent.click(screen.getByText('Reset'));
        expect(onReset).toHaveBeenCalled();
    });

    test('updates physics parameters', () => {
        const onUpdate = jest.fn();

        render(
            <PhysicsControls
                settings={{
                    gravity: { x: 0, y: -9.81 },
                    enabled: true
                }}
                onUpdate={onUpdate}
            />
        );

        fireEvent.change(screen.getByLabelText('Gravity Y'), {
            target: { value: '-5.0' }
        });

        expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
            gravity: { x: 0, y: -5.0 }
        }));
    });
});

describe('MediaControls Component', () => {
    test('handles effect creation', async () => {
        const onAddEffect = jest.fn();

        render(
            <MediaControls
                effects={[]}
                onAddEffect={onAddEffect}
            />
        );

        fireEvent.click(screen.getByText('Add Effect'));
        fireEvent.click(screen.getByText('Fade'));

        await waitFor(() => {
            expect(onAddEffect).toHaveBeenCalledWith(expect.objectContaining({
                effect_type: 'fade'
            }));
        });
    });

    test('handles audio track controls', () => {
        const onVolumeChange = jest.fn();

        render(
            <MediaControls
                tracks={[
                    { id: 1, name: 'Background Music', volume: 0.5 }
                ]}
                onVolumeChange={onVolumeChange}
            />
        );

        fireEvent.change(screen.getByLabelText('Volume'), {
            target: { value: '0.8' }
        });

        expect(onVolumeChange).toHaveBeenCalledWith(1, 0.8);
    });
});

describe('CollaborationPanel Component', () => {
    test('displays active collaborators', () => {
        render(
            <CollaborationPanel
                collaborators={[
                    { id: 1, name: 'User 1', status: 'active' },
                    { id: 2, name: 'User 2', status: 'idle' }
                ]}
            />
        );

        expect(screen.getByText('User 1')).toBeInTheDocument();
        expect(screen.getByText('User 2')).toBeInTheDocument();
    });

    test('handles permission changes', async () => {
        const onPermissionChange = jest.fn();

        render(
            <CollaborationPanel
                collaborators={[
                    { id: 1, name: 'User 1', role: 'viewer' }
                ]}
                onPermissionChange={onPermissionChange}
            />
        );

        fireEvent.click(screen.getByText('Change Role'));
        fireEvent.click(screen.getByText('Editor'));

        await waitFor(() => {
            expect(onPermissionChange).toHaveBeenCalledWith(1, 'editor');
        });
    });
});
