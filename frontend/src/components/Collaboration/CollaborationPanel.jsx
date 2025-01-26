import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import io from "socket.io-client";
import ErrorMessage from "../Common/ErrorMessage";
import LoadingSpinner from "../Common/LoadingSpinner";
import "./CollaborationPanel.css";

const CollaborationPanel = ({ universeId }) => {
  const [socket, setSocket] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState(null);
  const user = useSelector((state) => state.session.user);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_WEBSOCKET_URL, {
      query: { universeId, userId: user.id },
    });

    newSocket.on("connect", () => {
      setIsConnecting(false);
      setError(null);
    });

    newSocket.on("connect_error", () => {
      setIsConnecting(false);
      setError("Failed to connect to collaboration server");
    });

    newSocket.on("collaborators", (data) => {
      setCollaborators(data);
    });

    newSocket.on("message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on("parameter_change", ({ parameter, value, userId }) => {
      // Handle parameter changes from other users
      if (userId !== user.id) {
        // Update local state based on parameter changes
        console.log(
          `Parameter ${parameter} changed to ${value} by user ${userId}`,
        );
      }
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [universeId, user.id]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socket.emit("message", {
      text: newMessage,
      userId: user.id,
      username: user.username,
      timestamp: new Date().toISOString(),
    });

    setNewMessage("");
  };

  const handleParameterChange = (parameter, value) => {
    socket.emit("parameter_change", {
      parameter,
      value,
      userId: user.id,
      universeId,
    });
  };

  if (isConnecting) {
    return <LoadingSpinner text="Connecting to collaboration server..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="collaboration-panel">
      <div className="collaborators-section">
        <h3>Active Collaborators</h3>
        <div className="collaborators-list">
          {collaborators.map((collaborator) => (
            <div
              key={collaborator.id}
              className={`collaborator ${
                collaborator.id === user.id ? "current-user" : ""
              }`}
            >
              <div className="collaborator-status"></div>
              <span>{collaborator.username}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-section">
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${
                message.userId === user.id ? "own-message" : ""
              }`}
            >
              <div className="message-header">
                <span className="message-username">{message.username}</span>
                <span className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="message-content">{message.text}</div>
            </div>
          ))}
        </div>

        <form onSubmit={sendMessage} className="chat-input">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button type="submit">Send</button>
        </form>
      </div>

      <div className="collaboration-controls">
        <h3>Shared Controls</h3>
        <div className="control-buttons">
          <button
            onClick={() => handleParameterChange("sync", true)}
            className="sync-button"
          >
            Sync Parameters
          </button>
          <button
            onClick={() => handleParameterChange("lock", true)}
            className="lock-button"
          >
            Lock Parameters
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollaborationPanel;
