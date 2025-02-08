import { useCollaboration } from '@/contexts/CollaborationContext';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

const MessageTypes = {
  TEXT: 'text',
  SYSTEM: 'system',
};

const ChatMessage = ({ message, isCurrentUser }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
        <img
          src={message.avatar || '/default-avatar.png'}
          alt={message.username}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Message Content */}
      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        {/* Username and Timestamp */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{message.username}</span>
          <span>•</span>
          <span>{format(new Date(message.timestamp), 'HH:mm')}</span>
        </div>

        {/* Message Bubble */}
        <div
          className={`mt-1 px-4 py-2 rounded-lg max-w-[80%] ${
            message.type === MessageTypes.SYSTEM
              ? 'bg-gray-100 text-gray-600 italic'
              : isCurrentUser
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-800'
          }`}
        >
          {message.content}
        </div>
      </div>
    </motion.div>
  );
};

const ChatPanel = () => {
  const [message, setMessage] = useState('');
  const { messages, sendMessage } = useCollaboration();
  const currentUser = useSelector(selectCurrentUser);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = e => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessage({
      type: MessageTypes.TEXT,
      content: message.trim(),
      timestamp: new Date().toISOString(),
    });

    setMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Chat</h2>
      </div>

      {/* Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isCurrentUser={msg.user_id === currentUser?.id}
            />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
