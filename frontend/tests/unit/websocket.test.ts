import { mockWebSocket } from '../__mocks__/websocket';
import { WebSocketService } from '../services/websocket';

describe('WebSocket Service', () => {
    let wsService: WebSocketService;
    let mockWs: any;

    beforeEach(() => {
        mockWs = mockWebSocket();
        wsService = new WebSocketService('ws://localhost:8000');
        (wsService as any).ws = mockWs;
    });

    test('connects to websocket server', () => {
        expect(mockWs.url).toBe('ws://localhost:8000');
        expect(mockWs.readyState).toBe(WebSocket.OPEN);
    });

    test('handles connection events', () => {
        const onConnect = jest.fn();
        wsService.onConnect(onConnect);

        mockWs.emit('open');
        expect(onConnect).toHaveBeenCalled();
    });

    test('handles disconnection events', () => {
        const onDisconnect = jest.fn();
        wsService.onDisconnect(onDisconnect);

        mockWs.emit('close');
        expect(onDisconnect).toHaveBeenCalled();
    });

    test('sends messages', () => {
        const message = {
            type: 'update',
            data: { id: 1, name: 'Test' }
        };

        wsService.send(message);
        expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    test('receives messages', () => {
        const onMessage = jest.fn();
        wsService.onMessage(onMessage);

        const message = {
            type: 'update',
            data: { id: 1, name: 'Test' }
        };

        mockWs.emit('message', { data: JSON.stringify(message) });
        expect(onMessage).toHaveBeenCalledWith(message);
    });

    test('handles physics updates', () => {
        const onPhysicsUpdate = jest.fn();
        wsService.onPhysicsUpdate(onPhysicsUpdate);

        const update = {
            type: 'physics_update',
            data: {
                objects: [
                    {
                        id: 1,
                        position: { x: 100, y: 100 },
                        velocity: { x: 1, y: 0 }
                    }
                ]
            }
        };

        mockWs.emit('message', { data: JSON.stringify(update) });
        expect(onPhysicsUpdate).toHaveBeenCalledWith(update.data);
    });

    test('handles collaboration events', () => {
        const onCollaboration = jest.fn();
        wsService.onCollaborationEvent(onCollaboration);

        const event = {
            type: 'collaboration',
            data: {
                user_id: 1,
                action: 'edit',
                target: { id: 1, type: 'scene' }
            }
        };

        mockWs.emit('message', { data: JSON.stringify(event) });
        expect(onCollaboration).toHaveBeenCalledWith(event.data);
    });

    test('handles cursor updates', () => {
        const onCursorUpdate = jest.fn();
        wsService.onCursorUpdate(onCursorUpdate);

        const update = {
            type: 'cursor_update',
            data: {
                user_id: 1,
                position: { x: 100, y: 100 }
            }
        };

        mockWs.emit('message', { data: JSON.stringify(update) });
        expect(onCursorUpdate).toHaveBeenCalledWith(update.data);
    });

    test('handles reconnection', () => {
        const onReconnect = jest.fn();
        wsService.onReconnect(onReconnect);

        // Simulate disconnection
        mockWs.emit('close');

        // Simulate successful reconnection
        mockWs.emit('open');
        expect(onReconnect).toHaveBeenCalled();
    });

    test('handles error events', () => {
        const onError = jest.fn();
        wsService.onError(onError);

        const error = new Error('WebSocket error');
        mockWs.emit('error', error);
        expect(onError).toHaveBeenCalledWith(error);
    });

    test('handles scene join/leave', () => {
        const onJoin = jest.fn();
        const onLeave = jest.fn();
        wsService.onSceneJoin(onJoin);
        wsService.onSceneLeave(onLeave);

        // Join scene
        wsService.joinScene(1);
        expect(mockWs.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: 'join_scene',
                data: { scene_id: 1 }
            })
        );

        // Leave scene
        wsService.leaveScene(1);
        expect(mockWs.send).toHaveBeenCalledWith(
            JSON.stringify({
                type: 'leave_scene',
                data: { scene_id: 1 }
            })
        );
    });

    test('handles presence updates', () => {
        const onPresence = jest.fn();
        wsService.onPresenceUpdate(onPresence);

        const update = {
            type: 'presence_update',
            data: {
                scene_id: 1,
                users: [
                    { id: 1, name: 'User 1', status: 'active' },
                    { id: 2, name: 'User 2', status: 'idle' }
                ]
            }
        };

        mockWs.emit('message', { data: JSON.stringify(update) });
        expect(onPresence).toHaveBeenCalledWith(update.data);
    });

    test('handles batch updates', () => {
        const onBatchUpdate = jest.fn();
        wsService.onBatchUpdate(onBatchUpdate);

        const updates = {
            type: 'batch_update',
            data: {
                physics: [
                    { id: 1, position: { x: 0, y: 0 } }
                ],
                cursors: [
                    { user_id: 1, position: { x: 100, y: 100 } }
                ],
                presence: {
                    users: [{ id: 1, status: 'active' }]
                }
            }
        };

        mockWs.emit('message', { data: JSON.stringify(updates) });
        expect(onBatchUpdate).toHaveBeenCalledWith(updates.data);
    });

    test('handles message queuing during reconnection', () => {
        // Simulate disconnection
        mockWs.readyState = WebSocket.CONNECTING;

        // Try to send messages
        const messages = [
            { type: 'update', data: { id: 1 } },
            { type: 'update', data: { id: 2 } }
        ];

        messages.forEach(msg => wsService.send(msg));

        // Verify messages weren't sent
        expect(mockWs.send).not.toHaveBeenCalled();

        // Simulate reconnection
        mockWs.readyState = WebSocket.OPEN;
        mockWs.emit('open');

        // Verify queued messages were sent
        messages.forEach(msg => {
            expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(msg));
        });
    });
});
