import {
    KeyboardTab,
    Loop,
    Pause,
    PlayArrow,
    SkipNext,
    SkipPrevious,
    Stop,
    Timer,
} from '@mui/icons-material';
import {
    Box,
    IconButton,
    Slider,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useState } from 'react';


const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const TransportControls: React.FC = ({
    isPlaying,
    currentTime,
    onPlayPause,
    onTimeUpdate,
}) => {
    const theme = useTheme();
    const [tempo, setTempo] = useState(120);
    const [isLooping, setIsLooping] = useState(false);
    const [isMetronomeOn, setIsMetronomeOn] = useState(false);
    const [isSnapToGrid, setIsSnapToGrid] = useState(true);

    const handleTempoChange = (event: React.ChangeEvent) => {
        const newTempo = parseInt(event.target.value);
        if (!isNaN(newTempo) && newTempo >= 20 && newTempo <= 300) {
            setTempo(newTempo);
        }
    };

    const handleTimeSliderChange = (_: Event, value: number | number[]) => {
        onTimeUpdate(value as number);
    };

    return (
        <Box
            sx={{
                p: 2,
                borderBottom: 1,
                borderColor: 'divider',
                backgroundColor: theme.palette.background.paper,
            }}
        >
            <Stack spacing={2}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Stack direction="row" spacing={1}>
                        <IconButton size="small">
                            <SkipPrevious />
                        </IconButton>
                        <IconButton size="small" onClick={onPlayPause}>
                            {isPlaying ? <Pause /> : <PlayArrow />}
                        </IconButton>
                        <IconButton size="small">
                            <Stop />
                        </IconButton>
                        <IconButton size="small">
                            <SkipNext />
                        </IconButton>
                    </Stack>

                    <Typography variant="body2" sx={{ minWidth: 60 }}>
                        {formatTime(currentTime)}
                    </Typography>

                    <Slider
                        size="small"
                        value={currentTime}
                        onChange={handleTimeSliderChange}
                        min={0}
                        max={300} // TODO: Get actual duration
                        sx={{ minWidth: 200 }}
                    />

                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2">BPM</Typography>
                        <TextField
                            size="small"
                            value={tempo}
                            onChange={handleTempoChange}
                            sx={{ width: 60 }}
                            inputProps={{
                                min: 20,
                                max: 300,
                                type: 'number',
                                style: { padding: '4px 8px' },
                            }}
                        />
                    </Stack>

                    <Stack direction="row" spacing={1}>
                        <Tooltip title="Loop">
                            <IconButton
                                size="small"
                                onClick={() => setIsLooping(!isLooping)}
                                color={isLooping ? 'primary' : 'default'}
                            >
                                <Loop />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Metronome">
                            <IconButton
                                size="small"
                                onClick={() => setIsMetronomeOn(!isMetronomeOn)}
                                color={isMetronomeOn ? 'primary' : 'default'}
                            >
                                <Timer />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Snap to Grid">
                            <IconButton
                                size="small"
                                onClick={() => setIsSnapToGrid(!isSnapToGrid)}
                                color={isSnapToGrid ? 'primary' : 'default'}
                            >
                                <KeyboardTab />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>
            </Stack>
        </Box>
    );
};

export default TransportControls;
