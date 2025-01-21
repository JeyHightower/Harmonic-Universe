import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import styles from './PianoRoll.module.css';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const OCTAVES = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const GRID_SIZE = 16;
const NOTE_HEIGHT = 20;

const PianoRoll = ({
  notes,
  duration,
  onNoteAdd,
  onNoteUpdate,
  onNoteDelete,
}) => {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(100); // pixels per second
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const [selectedNote, setSelectedNote] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  const totalHeight = NOTES.length * OCTAVES.length * NOTE_HEIGHT;
  const totalWidth = duration * scale;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let x = 0; x < totalWidth; x += scale / GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x - scrollPosition.x, 0);
      ctx.lineTo(x - scrollPosition.x, canvas.height);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let y = 0; y < totalHeight; y += NOTE_HEIGHT) {
      ctx.beginPath();
      ctx.moveTo(0, y - scrollPosition.y);
      ctx.lineTo(canvas.width, y - scrollPosition.y);
      ctx.stroke();
    }

    // Draw piano keys
    ctx.fillStyle = 'white';
    OCTAVES.forEach((octave, octaveIndex) => {
      NOTES.forEach((note, noteIndex) => {
        const y =
          (octaveIndex * NOTES.length + noteIndex) * NOTE_HEIGHT -
          scrollPosition.y;
        ctx.fillStyle = note.includes('#') ? '#333' : '#fff';
        ctx.fillRect(0, y, 40, NOTE_HEIGHT - 1);

        if (!note.includes('#')) {
          ctx.fillStyle = '#000';
          ctx.font = '10px Arial';
          ctx.fillText(`${note}${octave}`, 5, y + 15);
        }
      });
    });

    // Draw notes
    notes.forEach(note => {
      const isSelected = selectedNote?.id === note.id;
      const y =
        (Math.floor(note.pitch / 12) * NOTES.length + (note.pitch % 12)) *
          NOTE_HEIGHT -
        scrollPosition.y;
      const x = note.startTime * scale - scrollPosition.x;
      const width = note.duration * scale;

      ctx.fillStyle = isSelected
        ? 'rgba(255, 165, 0, 0.8)'
        : 'rgba(0, 123, 255, 0.6)';
      ctx.fillRect(x + 40, y, width, NOTE_HEIGHT - 1);

      // Draw velocity indicator
      const velocityHeight = (NOTE_HEIGHT - 1) * note.velocity;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(x + 40, y + NOTE_HEIGHT - velocityHeight, 4, velocityHeight);
    });
  }, [notes, scale, scrollPosition, selectedNote, duration]);

  const handleMouseDown = e => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollPosition.x - 40;
    const y = e.clientY - rect.top + scrollPosition.y;

    const clickedNote = notes.find(note => {
      const noteY =
        (Math.floor(note.pitch / 12) * NOTES.length + (note.pitch % 12)) *
        NOTE_HEIGHT;
      const noteX = note.startTime * scale;
      return (
        x >= noteX &&
        x <= noteX + note.duration * scale &&
        y >= noteY &&
        y <= noteY + NOTE_HEIGHT
      );
    });

    if (clickedNote) {
      setSelectedNote(clickedNote);
      setIsDragging(true);
      setDragStart({ x, y });
    } else {
      // Add new note
      const pitch = Math.floor(y / NOTE_HEIGHT);
      const time = Math.max(0, x / scale);
      const newNote = {
        id: crypto.randomUUID(),
        pitch,
        startTime: time,
        duration: 0.25,
        velocity: 0.8,
      };
      onNoteAdd?.(newNote);
    }
  };

  const handleMouseMove = e => {
    if (!isDragging || !selectedNote) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollPosition.x - 40;
    const deltaX = x - dragStart.x;

    const newStartTime = Math.max(0, selectedNote.startTime + deltaX / scale);
    onNoteUpdate?.({
      ...selectedNote,
      startTime: newStartTime,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleWheel = e => {
    if (e.ctrlKey) {
      // Zoom
      const newScale = Math.max(50, Math.min(200, scale + e.deltaY * -0.5));
      setScale(newScale);
    } else {
      // Scroll
      setScrollPosition(prev => ({
        x: Math.max(0, prev.x + e.deltaX),
        y: Math.max(0, prev.y + e.deltaY),
      }));
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Delete' && selectedNote) {
      onNoteDelete?.(selectedNote);
      setSelectedNote(null);
    }
  };

  return (
    <div className={styles.pianoRoll} tabIndex={0} onKeyDown={handleKeyDown}>
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={styles.canvas}
      />
      <div className={styles.controls}>
        <button
          onClick={() => setScale(prev => Math.min(200, prev + 10))}
          className={styles.zoomButton}
        >
          Zoom In
        </button>
        <button
          onClick={() => setScale(prev => Math.max(50, prev - 10))}
          className={styles.zoomButton}
        >
          Zoom Out
        </button>
      </div>
    </div>
  );
};

PianoRoll.propTypes = {
  notes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      pitch: PropTypes.number.isRequired,
      startTime: PropTypes.number.isRequired,
      duration: PropTypes.number.isRequired,
      velocity: PropTypes.number.isRequired,
    })
  ).isRequired,
  duration: PropTypes.number.isRequired,
  onNoteAdd: PropTypes.func,
  onNoteUpdate: PropTypes.func,
  onNoteDelete: PropTypes.func,
};

PianoRoll.defaultProps = {
  onNoteAdd: undefined,
  onNoteUpdate: undefined,
  onNoteDelete: undefined,
};

export default PianoRoll;
