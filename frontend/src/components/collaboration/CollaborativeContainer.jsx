import { CollaborationProvider } from '@/contexts/CollaborationContext';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import ChatPanel from './ChatPanel';
import CommentsSystem from './CommentsSystem';
import CursorOverlay from './CursorOverlay';

const CollaborativeContainer = ({ children }) => {
  const [activePanel, setActivePanel] = useState(null);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);

  const togglePanel = panelName => {
    if (activePanel === panelName) {
      setIsPanelMinimized(!isPanelMinimized);
    } else {
      setActivePanel(panelName);
      setIsPanelMinimized(false);
    }
  };

  return (
    <CollaborationProvider>
      <div className="relative h-full flex">
        {/* Main Content Area */}
        <div className="flex-1 relative">
          {children}
          <CursorOverlay />
        </div>

        {/* Collaboration Tools */}
        <div className="w-16 bg-gray-100 border-l flex flex-col items-center py-4 space-y-4">
          {/* Chat Toggle */}
          <button
            onClick={() => togglePanel('chat')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              activePanel === 'chat'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </button>

          {/* Comments Toggle */}
          <button
            onClick={() => togglePanel('comments')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              activePanel === 'comments'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
          </button>
        </div>

        {/* Sliding Panel */}
        <AnimatePresence>
          {activePanel && (
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{
                x: isPanelMinimized ? '90%' : 0,
                opacity: 1,
              }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute right-16 top-0 bottom-0 w-80 bg-white border-l shadow-lg overflow-hidden"
            >
              {/* Panel Header */}
              <div className="h-12 border-b flex items-center justify-between px-4">
                <h2 className="font-semibold">{activePanel === 'chat' ? 'Chat' : 'Comments'}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPanelMinimized(!isPanelMinimized)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 transform transition-transform ${
                        isPanelMinimized ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setActivePanel(null)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Panel Content */}
              <div className="h-[calc(100%-3rem)]">
                {activePanel === 'chat' ? <ChatPanel /> : <CommentsSystem />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </CollaborationProvider>
  );
};

export default CollaborativeContainer;
