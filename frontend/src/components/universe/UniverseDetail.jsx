import { useUniverse } from '@/hooks/useUniverse';
import { Universe } from '@/store/slices/universeSlice';
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
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AIPromptDialog } from '../common/AIPromptDialog';
import { HarmonyControl } from '../common/HarmonyControl';
import { Vector3Control } from '../common/Vector3Control';
import { VisualizationControl } from '../common/VisualizationControl';


function TabPanel(props: TabPanelProps) {
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

export const UniverseDetail = () => {
    const { universeId } = useParams<{ universeId: string }>();
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
        gravity: {
            value: 9.81,
            unit: 'm/s²',
            min: 0,
            max: 20,
            enabled: true
        },
        friction: {
            value: 0.5,
            unit: 'coefficient',
            min: 0,
            max: 1,
            enabled: true
        },
        elasticity: {
            value: 0.7,
            unit: 'coefficient',
            min: 0,
            max: 1,
            enabled: true
        },
        air_resistance: {
            value: 0.1,
            unit: 'kg/m³',
            min: 0,
            max: 1,
            enabled: true
        },
        time_step: {
            value: 0.016,
            unit: 's',
            min: 0.001,
            max: 0.1,
            enabled: true
        },
        substeps: {
            value: 8,
            unit: 'steps',
            min: 1,
            max: 32,
            enabled: true
        }
    });

    useEffect(() => {
        if (universeId) {
            fetchUniverse(parseInt(universeId));
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
            [param]: {
                ...physicsParams[param],
                value
            }
        };
        setPhysicsParams(newParams);

        // Debounce the API call
        const timeoutId = setTimeout(() => {
            updatePhysics(currentUniverse.id, { [param]: newParams[param] });
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

    if (loading || !currentUniverse) {
        return Loading...</Typography>;
    }

    return (

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">{currentUniverse.name}</Typography>

                    {realtimeStatus.connected && (
                        <Tooltip title="Active Collaborators">

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
                    <Grid item xs={12}>


                                <Typography variant="h6" gutterBottom>
                                    Gravity
                                </Typography>
                                <Vector3Control
                                    value={physicsParams.gravity.value}
                                    onChange={(value) => handlePhysicsChange('gravity', value)}
                                    min={physicsParams.gravity.min}
                                    max={physicsParams.gravity.max}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12}>


                                <Typography variant="h6" gutterBottom>
                                    Friction
                                </Typography>
                                <Vector3Control
                                    value={physicsParams.friction.value}
                                    onChange={(value) => handlePhysicsChange('friction', value)}
                                    min={physicsParams.friction.min}
                                    max={physicsParams.friction.max}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12}>


                                <Typography variant="h6" gutterBottom>
                                    Elasticity
                                </Typography>
                                <Vector3Control
                                    value={physicsParams.elasticity.value}
                                    onChange={(value) => handlePhysicsChange('elasticity', value)}
                                    min={physicsParams.elasticity.min}
                                    max={physicsParams.elasticity.max}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12}>


                                <Typography variant="h6" gutterBottom>
                                    Air Resistance
                                </Typography>
                                <Vector3Control
                                    value={physicsParams.air_resistance.value}
                                    onChange={(value) => handlePhysicsChange('air_resistance', value)}
                                    min={physicsParams.air_resistance.min}
                                    max={physicsParams.air_resistance.max}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>


                                <Typography variant="h6" gutterBottom>
                                    Time Step
                                </Typography>
                                <Slider
                                    value={physicsParams.time_step.value}
                                    min={physicsParams.time_step.min}
                                    max={physicsParams.time_step.max}
                                    step={0.001}
                                    onChange={(_, value) =>
                                        handlePhysicsChange('time_step', value as number)
                                    }
                                    valueLabelDisplay="auto"
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>


                                <Typography variant="h6" gutterBottom>
                                    Substeps
                                </Typography>
                                <Slider
                                    value={physicsParams.substeps.value}
                                    min={physicsParams.substeps.min}
                                    max={physicsParams.substeps.max}
                                    step={1}
                                    onChange={(_, value) =>
                                        handlePhysicsChange('substeps', value as number)
                                    }
                                    valueLabelDisplay="auto"
                                />
                            </CardContent>
                        </Card>
                    </Grid>
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
                            </CardContent>
                        </Card>
                    </Grid>
                    {currentUniverse.storyPoints.map((point, index) => (
                        <Grid item xs={12} key={point.id}>


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
                                    {point.content}</Typography>
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
