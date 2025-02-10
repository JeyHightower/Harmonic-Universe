import fetchMock from 'jest-fetch-mock';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
    collaborationActions,
    mediaActions,
    physicsActions,
    sceneActions,
    storyboardActions,
    universeActions
} from '../store/actions';

import {
    sceneReducer,
    storyboardReducer,
    universeReducer
} from '../store/reducers';

const mockStore = configureMockStore([thunk]);

describe('Universe Actions', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    test('fetchUniverses success', async () => {
        const universes = [
            { id: 1, name: 'Universe 1' },
            { id: 2, name: 'Universe 2' }
        ];

        fetchMock.mockResponseOnce(JSON.stringify({ universes }));

        const store = mockStore({ universes: [] });
        await store.dispatch(universeActions.fetchUniverses());

        const actions = store.getActions();
        expect(actions[0]).toEqual({ type: 'FETCH_UNIVERSES_REQUEST' });
        expect(actions[1]).toEqual({
            type: 'FETCH_UNIVERSES_SUCCESS',
            payload: universes
        });
    });

    test('createUniverse success', async () => {
        const newUniverse = {
            name: 'New Universe',
            description: 'Test description'
        };

        fetchMock.mockResponseOnce(JSON.stringify({
            id: 1,
            ...newUniverse
        }));

        const store = mockStore({});
        await store.dispatch(universeActions.createUniverse(newUniverse));

        const actions = store.getActions();
        expect(actions[0]).toEqual({ type: 'CREATE_UNIVERSE_REQUEST' });
        expect(actions[1]).toEqual({
            type: 'CREATE_UNIVERSE_SUCCESS',
            payload: expect.objectContaining(newUniverse)
        });
    });
});

describe('Universe Reducer', () => {
    test('handles FETCH_UNIVERSES_SUCCESS', () => {
        const initialState = {
            items: [],
            loading: true,
            error: null
        };

        const universes = [
            { id: 1, name: 'Universe 1' },
            { id: 2, name: 'Universe 2' }
        ];

        const newState = universeReducer(initialState, {
            type: 'FETCH_UNIVERSES_SUCCESS',
            payload: universes
        });

        expect(newState.items).toEqual(universes);
        expect(newState.loading).toBe(false);
    });

    test('handles CREATE_UNIVERSE_SUCCESS', () => {
        const initialState = {
            items: [{ id: 1, name: 'Universe 1' }],
            loading: false,
            error: null
        };

        const newUniverse = { id: 2, name: 'Universe 2' };

        const newState = universeReducer(initialState, {
            type: 'CREATE_UNIVERSE_SUCCESS',
            payload: newUniverse
        });

        expect(newState.items).toHaveLength(2);
        expect(newState.items).toContainEqual(newUniverse);
    });
});

describe('Storyboard Actions', () => {
    test('fetchStoryboards success', async () => {
        const storyboards = [
            { id: 1, name: 'Storyboard 1', universeId: 1 },
            { id: 2, name: 'Storyboard 2', universeId: 1 }
        ];

        fetchMock.mockResponseOnce(JSON.stringify({ storyboards }));

        const store = mockStore({ storyboards: [] });
        await store.dispatch(storyboardActions.fetchStoryboards(1));

        const actions = store.getActions();
        expect(actions[0]).toEqual({ type: 'FETCH_STORYBOARDS_REQUEST' });
        expect(actions[1]).toEqual({
            type: 'FETCH_STORYBOARDS_SUCCESS',
            payload: storyboards
        });
    });
});

describe('Scene Actions', () => {
    test('updateScene success', async () => {
        const sceneUpdate = {
            id: 1,
            name: 'Updated Scene',
            content: { background: 'new.jpg' }
        };

        fetchMock.mockResponseOnce(JSON.stringify(sceneUpdate));

        const store = mockStore({});
        await store.dispatch(sceneActions.updateScene(1, sceneUpdate));

        const actions = store.getActions();
        expect(actions[0]).toEqual({ type: 'UPDATE_SCENE_REQUEST' });
        expect(actions[1]).toEqual({
            type: 'UPDATE_SCENE_SUCCESS',
            payload: sceneUpdate
        });
    });
});

describe('Physics Actions', () => {
    test('startSimulation success', async () => {
        const sceneId = 1;
        fetchMock.mockResponseOnce(JSON.stringify({ status: 'started' }));

        const store = mockStore({});
        await store.dispatch(physicsActions.startSimulation(sceneId));

        const actions = store.getActions();
        expect(actions[0]).toEqual({
            type: 'START_PHYSICS_SIMULATION',
            payload: { sceneId }
        });
    });
});

describe('Media Actions', () => {
    test('addEffect success', async () => {
        const effect = {
            sceneId: 1,
            type: 'fade',
            parameters: { duration: 1.0 }
        };

        fetchMock.mockResponseOnce(JSON.stringify({
            id: 1,
            ...effect
        }));

        const store = mockStore({});
        await store.dispatch(mediaActions.addEffect(effect));

        const actions = store.getActions();
        expect(actions[0]).toEqual({ type: 'ADD_EFFECT_REQUEST' });
        expect(actions[1]).toEqual({
            type: 'ADD_EFFECT_SUCCESS',
            payload: expect.objectContaining(effect)
        });
    });
});

describe('Collaboration Actions', () => {
    test('updateCollaborator success', async () => {
        const update = {
            userId: 1,
            role: 'editor',
            permissions: ['edit', 'comment']
        };

        fetchMock.mockResponseOnce(JSON.stringify(update));

        const store = mockStore({});
        await store.dispatch(collaborationActions.updateCollaborator(1, update));

        const actions = store.getActions();
        expect(actions[0]).toEqual({ type: 'UPDATE_COLLABORATOR_REQUEST' });
        expect(actions[1]).toEqual({
            type: 'UPDATE_COLLABORATOR_SUCCESS',
            payload: update
        });
    });
});

describe('Combined Reducers', () => {
    test('handles complex state updates', () => {
        const initialState = {
            universes: {
                items: [],
                loading: false
            },
            storyboards: {
                items: [],
                loading: false
            },
            scenes: {
                current: null,
                loading: false
            }
        };

        // Simulate multiple actions
        const universe = { id: 1, name: 'Universe 1' };
        const storyboard = { id: 1, name: 'Storyboard 1', universeId: 1 };
        const scene = { id: 1, name: 'Scene 1', storyboardId: 1 };

        let state = initialState;

        state = {
            ...state,
            universes: universeReducer(state.universes, {
                type: 'CREATE_UNIVERSE_SUCCESS',
                payload: universe
            })
        };

        state = {
            ...state,
            storyboards: storyboardReducer(state.storyboards, {
                type: 'CREATE_STORYBOARD_SUCCESS',
                payload: storyboard
            })
        };

        state = {
            ...state,
            scenes: sceneReducer(state.scenes, {
                type: 'SET_CURRENT_SCENE',
                payload: scene
            })
        };

        expect(state.universes.items).toContainEqual(universe);
        expect(state.storyboards.items).toContainEqual(storyboard);
        expect(state.scenes.current).toEqual(scene);
    });
});
