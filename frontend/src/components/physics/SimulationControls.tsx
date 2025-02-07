import {
    Pause,
    PlayArrow,
    Refresh,
    Settings,
    Timer,
} from '@mui/icons-material';
import {
    Box,
    IconButton,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { resetSimulation } from '@store/slices/physicsSlice';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

interface SimulationControlsProps {
    isSimulating: boolean;
    timeStep: number;
    onSimulationToggle: () => void;
    onTimeStepChange: (step: number) => void;
}

const SimulationControls: React.FC<SimulationControlsProps> = ({
    isSimulating,
    timeStep,
    onSimulationToggle,
    onTimeStepChange,
}) => {
    const dispatch = useDispatch();
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleReset = () => {
        dispatch(resetSimulation());
    };

    const handleTimeStepChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(event.target.value);
        if (!isNaN(value) && value > 0) {
            onTimeStepChange(value);
        }
    };

    return (
        <Box
            sx={{
                p: 2,
                borderBottom: 1,
                borderColor: 'divider',
                backgroundColor: 'background.paper',
            }}
        >
            <Stack direction="row" spacing={2} alignItems="center">
                <Stack direction="row" spacing={1}>
                    <Tooltip title={isSimulating ? 'Pause' : 'Play'}>
                        <IconButton onClick={onSimulationToggle}>
                            {isSimulating ? <Pause /> : <PlayArrow />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Reset">
                        <IconButton onClick={handleReset}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Stack>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Timer sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                        Time Step:
                    </Typography>
                    <TextField
                        size="small"
                        type="number"
                        value={timeStep}
                        onChange={handleTimeStepChange}
                        inputProps={{
                            step: 0.001,
                            min: 0.001,
                            max: 1,
                            style: { width: '80px' },
                        }}
                    />
                    <Typography variant="body2" color="text.secondary">
                        s
                    </Typography>
                </Box>

                <Tooltip title="Advanced Settings">
                    <IconButton onClick={() => setShowAdvanced(!showAdvanced)}>
                        <Settings />
                    </IconButton>
                </Tooltip>

                {showAdvanced && (
                    <Stack direction="row" spacing={2} alignItems="center">
                        {/* Add advanced simulation settings here */}
                        <Typography variant="body2" color="text.secondary">
                            Advanced settings panel (TODO)
                        </Typography>
                    </Stack>
                )}
            </Stack>
        </Box>
    );
};

export default SimulationControls;
