import { useUniverse } from '@/hooks/useUniverse';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import GroupIcon from '@mui/icons-material/Group';
import {
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    IconButton,
    Slider,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AIPromptDialog } from '../common/AIPromptDialog';
import { HarmonyControl } from '../common/HarmonyControl';
import { VisualizationControl } from '../common/VisualizationControl';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`universe-tabpanel-${index}`}
            aria-labelledby={`universe-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

export const UniverseDetail = () => {
    const { universeId } = useParams();
    const {
        currentUniverse,
        loading,
        realtimeStatus,
        fetchUniverse,
        updateUniverse,
        updatePhysics,
        updateHarmonyParams,
        updateVisualizationParams,
        addStoryPoint,
        generateWithAI,
        exportUniverse,
    } = useUniverse();

    const [tabValue, setTabValue] = useState(0);
    const [storyPoint, setStoryPoint] = useState('');
    const [aiDialogOpen, setAiDialogOpen] = useState(false);
    const [aiPromptType, setAiPromptType] = useState('story');
    const [physicsParams, setPhysicsParams] = useState({
        gravity: 9.81,
        air_resistance: 0.1,
        elasticity: 0.8,
        friction: 0.2,
        temperature: 293.15,
        pressure: 101.325
    });

    useEffect(() => {
        if (universeId) {
            fetchUniverse(parseInt(universeId, 10));
        }
    }, [universeId, fetchUniverse]);

    useEffect(() => {
        if (currentUniverse?.physics_params) {
            setPhysicsParams(currentUniverse.physics_params);
        }
    }, [currentUniverse]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handlePhysicsChange = async (param, value) => {
        if (!currentUniverse) return;

        const newParams = {
            ...physicsParams,
            [param]: value
        };
        setPhysicsParams(newParams);

        // Debounce the API call
        const timeoutId = setTimeout(() => {
            updatePhysics(currentUniverse.id, { [param]: value });
        }, 500);

        return () => clearTimeout(timeoutId);
    };

    const handlePhysicsToggle = async (param) => {
        if (!currentUniverse) return;

        const newParams = {
            ...physicsParams,
            [param]: {
                ...physicsParams[param],
                enabled: !physicsParams[param].enabled
            }
        };
        setPhysicsParams(newParams);

        updatePhysics(currentUniverse.id, { [param]: newParams[param] });
    };

    const handleHarmonyChange = async (param, value) => {
        if (!currentUniverse) return;

        const newParams = {
            ...harmonyParams,
            [param]: {
                ...harmonyParams[param],
                value
            }
        };
        setHarmonyParams(newParams);

        // Debounce the API call
        const timeoutId = setTimeout(() => {
            updateHarmonyParams(currentUniverse.id, { [param]: newParams[param] });
        }, 500);

        return () => clearTimeout(timeoutId);
    };

    const handleAIGenerate = async (prompt: string) => {
        if (!currentUniverse) return;

        try {
            await generateWithAI({
                universeId: currentUniverse.id,
                prompt,
                type: aiPromptType,
            });
            setAiDialogOpen(false);
        } catch (error) {
            console.error('AI generation failed:', error);
        }
    };

    const handleAddStoryPoint = async () => {
        if (!currentUniverse || !storyPoint) return;

        await addStoryPoint(currentUniverse.id, {
            content: storyPoint,
            harmonyTie: {
                frequency: currentUniverse.harmonyParams.baseFrequency,
                tempo: currentUniverse.harmonyParams.tempo,
                scale: currentUniverse.harmonyParams.scale,
                intensity: 1.0,
            },
        });

        setStoryPoint('');
    };

    const handleExport = async (format: 'json' | 'audio' | 'visualization') => {
        if (!currentUniverse) return;

        const result = await exportUniverse({
            universeId: currentUniverse.id,
            format,
        });

        if (result) {
            switch (format) {
                case 'json':
                    const blob = new Blob([JSON.stringify(result, null, 2)], {
                        type: 'application/json',
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `universe-${currentUniverse.id}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    break;
                case 'audio':
                    window.open(result.audio_url, '_blank');
                    break;
                case 'visualization':
                    window.open(result.visualization_url, '_blank');
                    break;
            }
        }
    };

    const renderPhysicsParameter = (param, label, unit, min, max) => {
        if (!physicsParams[param]) return null;

        return (
            <Grid item xs={12} md={6}>
                <Card>
                    <CardContent>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1">
                                {label} ({unit})
                            </Typography>
                            <Slider
                                value={physicsParams[param]}
                                onChange={(_, value) => handlePhysicsChange(param, value)}
                                min={min}
                                max={max}
                                step={(max - min) / 100}
                                valueLabelDisplay="auto"
                                valueLabelFormat={value => `${value} ${unit}`}
                                marks={[
                                    { value: min, label: min },
                                    { value: max, label: max },
                                ]}
                            />
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        );
    };

    if (loading || !currentUniverse) {
        return <Typography>Loading...</Typography>;
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">{currentUniverse.name}</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {realtimeStatus.connected && (
                        <Tooltip title="Active Collaborators">
                            <IconButton>
                                <GroupIcon />
                                <Typography variant="caption" sx={{ ml: 1 }}>
                                    {realtimeStatus.activeCollaborators.length}
                                </Typography>
                            </IconButton>
                        </Tooltip>
                    )}
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleExport('json')}
                        sx={{ mr: 1 }}
                    >
                        Export JSON
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleExport('audio')}
                        sx={{ mr: 1 }}
                    >
                        Export Audio
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleExport('visualization')}
                    >
                        Export Visualization
                    </Button>
                </Box>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="Physics" />
                    <Tab label="Harmony" />
                    <Tab label="Visualization" />
                    <Tab label="Story" />
                </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Tooltip title="Generate Physics with AI">
                        <IconButton
                            onClick={() => {
                                setAiPromptType('physics');
                                setAiDialogOpen(true);
                            }}
                        >
                            <AutoFixHighIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
                <Grid container spacing={3}>
                    {renderPhysicsParameter('gravity', 'Gravity', 'm/s²', 0, 20)}
                    {renderPhysicsParameter('friction', 'Friction', 'coefficient', 0, 1)}
                    {renderPhysicsParameter('elasticity', 'Elasticity', 'coefficient', 0, 1)}
                    {renderPhysicsParameter('air_resistance', 'Air Resistance', 'kg/m³', 0, 1)}
                    {renderPhysicsParameter('temperature', 'Temperature', 'K', 0, 1000)}
                    {renderPhysicsParameter('pressure', 'Pressure', 'kPa', 0, 200)}
                </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Tooltip title="Generate Harmony with AI">
                        <IconButton
                            onClick={() => {
                                setAiPromptType('harmony');
                                setAiDialogOpen(true);
                            }}
                        >
                            <AutoFixHighIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
                <HarmonyControl
                    value={currentUniverse.harmonyParams}
                    onChange={(params) => updateHarmonyParams(currentUniverse.id, params)}
                />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                <VisualizationControl
                    value={currentUniverse.visualizationParams}
                    onChange={(params) => updateVisualizationParams(currentUniverse.id, params)}
                />
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Tooltip title="Generate Story with AI">
                        <IconButton
                            onClick={() => {
                                setAiPromptType('story');
                                setAiDialogOpen(true);
                            }}
                        >
                            <AutoFixHighIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            variant="outlined"
                            label="New Story Point"
                            value={storyPoint}
                            onChange={(e) => setStoryPoint(e.target.value)}
                        />
                        <Button
                            variant="contained"
                            onClick={handleAddStoryPoint}
                            disabled={!storyPoint}
                            sx={{ mt: 2 }}
                        >
                            Add Story Point
                        </Button>
                    </Grid>
                    {currentUniverse.storyPoints.map((point, index) => (
                        <Grid item xs={12} key={point.id}>
                            <Card>
                                <CardContent>
                                    <Typography
                                        variant="subtitle2"
                                        color="text.secondary"
                                        gutterBottom
                                    >
                                        Point {index + 1} -{' '}
                                        {new Date(point.timestamp).toLocaleString()}
                                        {point.aiGenerated && (
                                            <Tooltip title="AI Generated">
                                                <AutoFixHighIcon
                                                    fontSize="small"
                                                    sx={{ ml: 1, verticalAlign: 'middle' }}
                                                />
                                            </Tooltip>
                                        )}
                                    </Typography>
                                    {point.content}
                                    {point.harmonyTie && (
                                        <Box sx={{ mt: 2 }}>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                Harmony: {point.harmonyTie.scale} at{' '}
                                                {point.harmonyTie.frequency}Hz,{' '}
                                                {point.harmonyTie.tempo}BPM
                                                (Intensity: {point.harmonyTie.intensity})
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </TabPanel>

            <AIPromptDialog
                open={aiDialogOpen}
                onClose={() => setAiDialogOpen(false)}
                onGenerate={handleAIGenerate}
                type={aiPromptType}
            />
        </Box>
    );
};

export default UniverseDetail;
