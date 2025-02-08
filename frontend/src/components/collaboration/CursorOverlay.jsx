import { useCollaboration } from '@/contexts/CollaborationContext';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { motion, AnimatePresence } from 'framer-motion';

const CursorOverlay = () => {
  const { cursors, updateCursor } = useCollaboration();
  const currentUser = useSelector(selectCurrentUser);
  const throttleRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (throttleRef.current) return;

      throttleRef.current = setTimeout(() => {
        throttleRef.current = null;
      }, 50); // Throttle to 20fps

      const rect = document.body.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      updateCursor({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, [updateCursor]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <AnimatePresence>
        {Object.values(cursors).map((cursor) => {
          if (cursor.user_id === currentUser?.id) return null;

          return (
            <motion.div
              key={cursor.user_id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                left: `${cursor.x * 100}%`,
                top: `${cursor.y * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Cursor Icon */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  transform: 'rotate(-45deg)',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                }}
              >
                <path
                  d="M5 2l14 14-6 2-2 6L5 2z"
                  fill={cursor.color}
                  stroke="white"
                  strokeWidth="1.5"
                />
              </svg>

              {/* Username Label */}
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '100%',
                  transform: 'translateX(-50%)',
                  background: cursor.color,
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                {cursor.username}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default CursorOverlay;
