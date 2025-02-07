import {
    ContentCopy,
    ContentCut,
    ContentPaste,
    ZoomIn,
    ZoomOut,
} from '@mui/icons-material';
import { Box, IconButton, Slider, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { RootState } from '@store/index';
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline';

interface WaveformEditorProps {
    trackId: number | null;
    isPlaying: boolean;
    currentTime: number;
    onTimeUpdate: (time: number) => void;
}

const WaveformEditor: React.FC<WaveformEditorProps> = ({
    trackId,
    isPlaying,
    currentTime,
    onTimeUpdate,
}) => {
    const theme = useTheme();
    const waveformRef = useRef<HTMLDivElement>(null);
    const wavesurfer = useRef<WaveSurfer | null>(null);
    const [zoom, setZoom] = useState(50);
    const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);

    const track = useSelector((state: RootState) =>
        state.audio.tracks.find((t) => t.id === trackId)
    );

    useEffect(() => {
        if (waveformRef.current && track) {
            // Initialize WaveSurfer
            wavesurfer.current = WaveSurfer.create({
                container: waveformRef.current,
                waveColor: theme.palette.primary.main,
                progressColor: theme.palette.secondary.main,
                cursorColor: theme.palette.error.main,
                height: 128,
                normalize: true,
                plugins: [
                    RegionsPlugin.create(),
                    TimelinePlugin.create({
                        container: '#timeline',
                        primaryColor: theme.palette.text.primary,
                        secondaryColor: theme.palette.text.secondary,
                        primaryFontColor: theme.palette.text.primary,
                        secondaryFontColor: theme.palette.text.secondary,
                    }),
                ],
            });

            // Load audio file
            wavesurfer.current.load(track.file_path);

            // Event handlers
            wavesurfer.current.on('ready', () => {
                wavesurfer.current?.setVolume(track.volume);
            });

            wavesurfer.current.on('timeupdate', (time) => {
                onTimeUpdate(time);
            });

            wavesurfer.current.on('region-created', (region) => {
                setSelection({ start: region.start, end: region.end });
            });

            return () => {
                wavesurfer.current?.destroy();
            };
        }
    }, [track, theme]);

    useEffect(() => {
        if (wavesurfer.current) {
            if (isPlaying) {
                wavesurfer.current.play();
            } else {
                wavesurfer.current.pause();
            }
        }
    }, [isPlaying]);

    useEffect(() => {
        if (wavesurfer.current && track) {
            wavesurfer.current.setVolume(track.volume);
        }
    }, [track?.volume]);

    const handleZoomChange = (_: Event, value: number | number[]) => {
        const zoomLevel = value as number;
        setZoom(zoomLevel);
        if (wavesurfer.current) {
            wavesurfer.current.zoom(zoomLevel);
        }
    };

    const handleCut = () => {
        if (selection) {
            // TODO: Implement cut functionality
        }
    };

    const handleCopy = () => {
        if (selection) {
            // TODO: Implement copy functionality
        }
    };

    const handlePaste = () => {
        // TODO: Implement paste functionality
    };

    if (!track) {
        return (
            <Box
                sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography variant="h6" color="text.secondary">
                    Select a track to view waveform
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle1">{track.name}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ZoomOut />
                    <Slider
                        value={zoom}
                        onChange={handleZoomChange}
                        min={1}
                        max={100}
                        sx={{ mx: 2, width: 100 }}
                    />
                    <ZoomIn />
                </Box>
                <IconButton onClick={handleCut} disabled={!selection}>
                    <ContentCut />
                </IconButton>
                <IconButton onClick={handleCopy} disabled={!selection}>
                    <ContentCopy />
                </IconButton>
                <IconButton onClick={handlePaste}>
                    <ContentPaste />
                </IconButton>
            </Stack>
            <Box id="timeline" sx={{ height: 30, width: '100%' }} />
            <Box ref={waveformRef} sx={{ flexGrow: 1, width: '100%' }} />
        </Box>
    );
};

export default WaveformEditor;
