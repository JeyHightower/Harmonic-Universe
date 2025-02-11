import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import styles from './CollaborationPanel.module.css';

const CursorOverlay = ({ cursors }) => {
  return (
    <div className={styles.cursorOverlay}>
      {Object.entries(cursors).map(([userId, { position, username }]) => (
        <div
          key={userId}
          className={styles.remoteCursor}
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          <div className={styles.cursorPoint} />
          <span className={styles.cursorLabel}>{username}</span>
        </div>
      ))}
    </div>
  );
};

const UserPresence = ({ users }) => {
  return (
    <div className={styles.presenceList}>
      <h3>Active Users</h3>
      {users.map(user => (
        <div key={user.id} className={styles.presenceItem}>
          <div
            className={styles.presenceIndicator}
            style={{ backgroundColor: user.isActive ? '#4CAF50' : '#9E9E9E' }}
          />
          <span>{user.username}</span>
          {user.isTyping && (
            <span className={styles.typingIndicator}>typing...</span>
          )}
        </div>
      ))}
    </div>
  );
};

const CollaborationPanel = ({ universeId }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [cursors, setCursors] = useState({});
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    // Join universe room
    socket.emit('join', { universe_id: universeId });

    // Listen for user updates
    socket.on('user_joined', data => {
      setUsers(prev => [...prev, data.user]);
    });

    socket.on('user_left', data => {
      setUsers(prev => prev.filter(u => u.id !== data.user_id));
    });

    // Listen for cursor updates
    socket.on('cursor_moved', data => {
      setCursors(prev => ({
        ...prev,
        [data.user_id]: {
          position: data.position,
          username: data.username,
        },
      }));
    });

    // Listen for chat messages
    socket.on('new_message', data => {
      setMessages(prev => [...prev, data]);
    });

    // Listen for typing indicators
    socket.on('user_typing', data => {
      setUsers(prev =>
        prev.map(u =>
          u.id === data.user_id ? { ...u, isTyping: data.isTyping } : u
        )
      );
    });

    return () => {
      socket.emit('leave', { universe_id: universeId });
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('cursor_moved');
      socket.off('new_message');
      socket.off('user_typing');
    };
  }, [socket, universeId]);

  const handleMouseMove = e => {
    if (!socket) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    socket.emit('cursor_move', {
      universe_id: universeId,
      position,
    });
  };

  const handleMessageSubmit = e => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket) return;

    socket.emit('chat_message', {
      universe_id: universeId,
      message: inputMessage,
    });

    setInputMessage('');
    setIsTyping(false);
  };

  const handleInputChange = e => {
    setInputMessage(e.target.value);

    if (!isTyping && socket) {
      setIsTyping(true);
      socket.emit('user_typing', {
        universe_id: universeId,
        isTyping: true,
      });
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('user_typing', {
        universe_id: universeId,
        isTyping: false,
      });
    }, 1000);
  };

  return (
    <div className={styles.collaborationPanel}>
      <div className={styles.mainArea} onMouseMove={handleMouseMove}>
        <CursorOverlay cursors={cursors} />
        <div className={styles.content}>{/* Main content area */}</div>
      </div>

      <div className={styles.sidebar}>
        <UserPresence users={users} />

        <div className={styles.chat}>
          <div className={styles.messages}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`${styles.message} ${
                  msg.user_id === user.id ? styles.ownMessage : ''
                }`}
              >
                <span className={styles.username}>{msg.username}</span>
                <p>{msg.message}</p>
                <span className={styles.timestamp}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleMessageSubmit} className={styles.messageForm}>
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className={styles.messageInput}
            />
            <button type="submit" className={styles.sendButton}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CollaborationPanel;
