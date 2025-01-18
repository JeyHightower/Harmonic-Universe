import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import WebSocketManager from '../../services/WebSocketManager';
import './AudioWorkspace.css';

const AudioWorkspace = () => {
  const dispatch = useDispatch();
  const [wsManager] = useState(() => new WebSocketManager());
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const frequencies = useSelector(state => state.audio.frequencies);

  useEffect(() => {
    // Initialize WebSocket connection
    wsManager.connect();

    // Override the default message handler
    wsManager.handleMessage = message => {
      switch (message.type) {
        case 'audioAnalysis':
          dispatch({
            type: 'SET_FREQUENCIES',
            payload: message.data.frequencies,
          });
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    };

    // Update connection status based on WebSocket events
    const originalOnOpen = wsManager.socket.onopen;
    const originalOnClose = wsManager.socket.onclose;
    const originalOnError = wsManager.socket.onerror;

    wsManager.socket.onopen = (...args) => {
      setConnectionStatus('connected');
      originalOnOpen?.(...args);
    };

    wsManager.socket.onclose = (...args) => {
      setConnectionStatus('disconnected');
      originalOnClose?.(...args);
    };

    wsManager.socket.onerror = (...args) => {
      setConnectionStatus('error');
      originalOnError?.(...args);
    };

    return () => {
      wsManager.disconnect();
    };
  }, [dispatch, wsManager]);

  return (
    <div className="audio-workspace">
      <div className="connection-status">
        {connectionStatus === 'connecting' && (
          <p>Connecting to audio server...</p>
        )}
        {connectionStatus === 'connected' && <p>Connected to audio server</p>}
        {connectionStatus === 'disconnected' && <p>Connection lost</p>}
        {connectionStatus === 'error' && <p>Connection error</p>}
      </div>

      {/* Audio visualization based on frequencies */}
      <div className="frequency-display">
        <div
          className="frequency-bar"
          style={{ height: `${frequencies.bass * 100}%` }}
        >
          Bass: {Math.round(frequencies.bass * 100)}%
        </div>
        <div
          className="frequency-bar"
          style={{ height: `${frequencies.mid * 100}%` }}
        >
          Mid: {Math.round(frequencies.mid * 100)}%
        </div>
        <div
          className="frequency-bar"
          style={{ height: `${frequencies.high * 100}%` }}
        >
          High: {Math.round(frequencies.high * 100)}%
        </div>
      </div>
    </div>
  );
};

export default AudioWorkspace;
