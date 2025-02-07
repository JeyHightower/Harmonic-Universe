import {
    Add as AddIcon,
    GridOff,
    GridOn,
    Remove as RemoveIcon,
} from '@mui/icons-material';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { RootState } from '@store/index';
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

interface MIDIEditorProps {
    trackId: number | null;
    isPlaying: boolean;
    currentTime: number;
}

interface Note {
    id: number;
    pitch: number;
    startTime: number;
    duration: number;
    velocity: number;
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const OCTAVES = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const NOTE_HEIGHT = 20;
const PIXELS_PER_SECOND = 100;

const MIDIEditor: React.FC<MIDIEditorProps> = ({ trackId, isPlaying, currentTime }) => {
    const theme = useTheme();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [zoom, setZoom] = useState(1);
    const [showGrid, setShowGrid] = useState(true);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });

    const track = useSelector((state: RootState) =>
        state.audio.tracks.find((t) => t.id === trackId)
    );

    const midiSequence = useSelector((state: RootState) =>
        track ? state.audio.midiSequences.find((s) => s.id === track.midi_sequence_id) : null
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !midiSequence) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        if (showGrid) {
            ctx.strokeStyle = theme.palette.divider;
            ctx.lineWidth = 1;

            // Vertical lines (time)
            for (let x = 0; x < canvas.width; x += PIXELS_PER_SECOND * zoom) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }

            // Horizontal lines (notes)
            for (let y = 0; y < canvas.height; y += NOTE_HEIGHT) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
        }

        // Draw notes
        midiSequence.events
            .filter((event) => event.event_type === 'note_on')
            .forEach((note) => {
                const x = note.timestamp * PIXELS_PER_SECOND * zoom;
                const y = (127 - note.note) * NOTE_HEIGHT;
                const width = (note.duration || 0) * PIXELS_PER_SECOND * zoom;

                ctx.fillStyle =
                    selectedNote?.id === note.id
                        ? theme.palette.secondary.main
                        : theme.palette.primary.main;
                ctx.fillRect(x, y, width, NOTE_HEIGHT - 1);
            });

        // Draw playhead
        if (isPlaying) {
            const playheadX = currentTime * PIXELS_PER_SECOND * zoom;
            ctx.strokeStyle = theme.palette.error.main;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(playheadX, 0);
            ctx.lineTo(playheadX, canvas.height);
            ctx.stroke();
        }
    }, [midiSequence, zoom, showGrid, selectedNote, isPlaying, currentTime, theme]);

    const handleZoomIn = () => {
        setZoom((prev) => Math.min(prev * 1.5, 10));
    };

    const handleZoomOut = () => {
        setZoom((prev) => Math.max(prev / 1.5, 0.1));
    };

    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas || !midiSequence) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const time = x / (PIXELS_PER_SECOND * zoom);
        const pitch = 127 - Math.floor(y / NOTE_HEIGHT);

        // Find clicked note
        const clickedNote = midiSequence.events
            .filter((event) => event.event_type === 'note_on')
            .find(
                (note) =>
                    note.note === pitch &&
                    time >= note.timestamp &&
                    time <= note.timestamp + (note.duration || 0)
            );

        setSelectedNote(clickedNote || null);
    };

    if (!track || !midiSequence) {
        return (
            <Box
                sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography variant="subtitle1" color="text.secondary">
                    No MIDI sequence available
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle1">MIDI Editor</Typography>
                <IconButton onClick={handleZoomIn}>
                    <AddIcon />
                </IconButton>
                <IconButton onClick={handleZoomOut}>
                    <RemoveIcon />
                </IconButton>
                <IconButton onClick={() => setShowGrid((prev) => !prev)}>
                    {showGrid ? <GridOn /> : <GridOff />}
                </IconButton>
            </Stack>
            <Box
                sx={{
                    flexGrow: 1,
                    position: 'relative',
                    overflow: 'auto',
                    border: 1,
                    borderColor: 'divider',
                }}
            >
                <canvas
                    ref={canvasRef}
                    width={midiSequence.duration * PIXELS_PER_SECOND * zoom}
                    height={128 * NOTE_HEIGHT}
                    onClick={handleCanvasClick}
                    style={{ cursor: 'pointer' }}
                />
            </Box>
        </Box>
    );
};

export default MIDIEditor;
