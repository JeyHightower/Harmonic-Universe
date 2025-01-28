import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import styles from './Editor.module.css';

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className={styles.menuBar}>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? styles.isActive : ''}
      >
        bold
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? styles.isActive : ''}
      >
        italic
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={editor.isActive('strike') ? styles.isActive : ''}
      >
        strike
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={editor.isActive('code') ? styles.isActive : ''}
      >
        code
      </button>
      <button onClick={() => editor.chain().focus().unsetAllMarks().run()}>
        clear marks
      </button>
      <button onClick={() => editor.chain().focus().clearNodes().run()}>
        clear nodes
      </button>
      <button
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={editor.isActive('paragraph') ? styles.isActive : ''}
      >
        paragraph
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={
          editor.isActive('heading', { level: 1 }) ? styles.isActive : ''
        }
      >
        h1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={
          editor.isActive('heading', { level: 2 }) ? styles.isActive : ''
        }
      >
        h2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? styles.isActive : ''}
      >
        bullet list
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? styles.isActive : ''}
      >
        ordered list
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={editor.isActive('codeBlock') ? styles.isActive : ''}
      >
        code block
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? styles.isActive : ''}
      >
        blockquote
      </button>
      <button onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        horizontal rule
      </button>
      <button onClick={() => editor.chain().focus().setHardBreak().run()}>
        hard break
      </button>
      <button onClick={() => editor.chain().focus().undo().run()}>undo</button>
      <button onClick={() => editor.chain().focus().redo().run()}>redo</button>
    </div>
  );
};

const RichTextEditor = ({
  universeId,
  initialContent,
  onChange,
  readOnly = false,
}) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [status, setStatus] = useState('connecting');
  const editorRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.emit('join_document', { universe_id: universeId });

    socket.on('document_status', newStatus => {
      setStatus(newStatus);
    });

    return () => {
      socket.emit('leave_document', { universe_id: universeId });
      socket.off('document_status');
    };
  }, [socket, universeId]);

  const editor = new Editor({
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: initialContent,
        field: 'content',
        onSyncRequestReceived: () => {
          socket.emit('sync_request', { universe_id: universeId });
        },
        onSyncReceived: data => {
          socket.emit('sync_received', { universe_id: universeId, data });
        },
      }),
      CollaborationCursor.configure({
        user: {
          name: user.username,
          color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        },
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      socket.emit('content_update', {
        universe_id: universeId,
        content: editor.getHTML(),
      });
    },
    editable: !readOnly,
  });

  return (
    <div className={styles.editorContainer}>
      {!readOnly && <MenuBar editor={editor} />}
      <div className={styles.statusBar}>
        <span className={styles.status}>
          {status === 'connected' ? '🟢 Connected' : '🔄 Syncing...'}
        </span>
        {status === 'connected' && (
          <span className={styles.savedStatus}>All changes saved</span>
        )}
      </div>
      <div className={styles.editor} ref={editorRef}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichTextEditor;
