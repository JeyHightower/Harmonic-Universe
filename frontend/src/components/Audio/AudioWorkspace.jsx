import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import WebSocketClient from '../../services/WebSocketClient';
import { setFrequencies } from '../../store/actions/audio';
import './AudioWorkspace.css';

const AudioWorkspace = () => {
  const dispatch = useDispatch();
  const [wsClient] = useState(() => new WebSocketClient());
  const frequencies = useSelector(state => state.audio.frequencies);
  const connected = useSelector(state => state.websocket.connected);

  useEffect(() => {
    // Initialize WebSocket connection
    wsClient.connect();

    // Add audio analysis handler
    wsClient.socket.on('audio_analysis', data => {
      dispatch(setFrequencies(data.frequencies));
    });

    return () => {
      wsClient.disconnect();
    };
  }, [dispatch, wsClient]);

  return (
    <div className="audio-workspace">
      {!connected && (
        <div className="connection-status">
          Connection lost. Attempting to reconnect...
        </div>
      )}
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
