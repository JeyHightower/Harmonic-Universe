import { useUniverse } from '@/hooks/useUniverse';
import {
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    Slider,
    Tab,
    Tabs,
    TextField,
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

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

const UniverseDetail = () => {
    const { universeId } = useParams();
    const {
        currentUniverse,
        loading,
        fetchUniverse,
        updateUniverse,
        updatePhysics,
        addStoryPoint,
        exportUniverse,
    } = useUniverse();

    const [tabValue, setTabValue] = useState(0);
    const [storyPoint, setStoryPoint] = useState('');
    const [physicsParams, setPhysicsParams] = useState({
        gravity: 9.81,
        friction: 0.5,
        elasticity: 0.7,
        airResistance: 0.1,
        timeDilation: 1.0,
    });

    useEffect(() => {
        if (universeId) {
            fetchUniverse(parseInt(universeId));
        }
    }, [universeId, fetchUniverse]);

    useEffect(() => {
        if (currentUniverse) {
            setPhysicsParams(currentUniverse.physicsParams);
        }
    }, [currentUniverse]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handlePhysicsChange = async (param, value) => {
        if (!currentUniverse) return;

        const newParams = {
            ...physicsParams,
            [param]: value,
        };
        setPhysicsParams(newParams);

        // Debounce the API call
        const timeoutId = setTimeout(() => {
            updatePhysics(currentUniverse.id, { [param]: value });
        }, 500);

        return () => clearTimeout(timeoutId);
    };

    const handleAddStoryPoint = async () => {
        if (!currentUniverse || !storyPoint) return;

        await addStoryPoint(currentUniverse.id, {
            content: storyPoint,
            harmonyTie: {
                frequency: currentUniverse.harmonyParams.baseFrequency,
                tempo: currentUniverse.harmonyParams.tempo,
                scale: currentUniverse.harmonyParams.scale,
            },
        });

        setStoryPoint('');
    };

    const handleExport = async (format) => {
        if (!currentUniverse) return;

        const result = await exportUniverse(currentUniverse.id, format);
        if (result) {
            if (format === 'json') {
                // Download JSON file
                const blob = new Blob([JSON.stringify(result, null, 2)], {
                    type: 'application/json',
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `universe-${currentUniverse.id}.json`;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                // Handle audio download
                window.open(result.audio_url, '_blank');
            }
        }
    };

    if (loading || !currentUniverse) {
        return <Typography>Loading...</Typography>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                {currentUniverse.name}
            </Typography>
            <Typography color="text.secondary" paragraph>
                {currentUniverse.description}
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="Physics" />
                    <Tab label="Harmony" />
                    <Tab label="Story" />
                </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                    {Object.entries(physicsParams).map(([param, value]) => (
                        <Grid item xs={12} key={param}>
                            <Card>
                                <CardContent>
                                    <Typography
                                        variant="subtitle1"
                                        gutterBottom
                                        sx={{ textTransform: 'capitalize' }}
                                    >
                                        {param.replace(/([A-Z])/g, ' $1').trim()}
                                    </Typography>
                                    <Slider
                                        value={value}
                                        min={0}
                                        max={
                                            param === 'gravity'
                                                ? 20
                                                : param === 'timeDilation'
                                                    ? 2
                                                    : 1
                                        }
                                        step={0.01}
                                        onChange={(_, value) =>
                                            handlePhysicsChange(param, value)
                                        }
                                        valueLabelDisplay="auto"
                                    />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Current Harmony
                                </Typography>
                                <Typography>
                                    Frequency:{' '}
                                    {currentUniverse.harmonyParams.baseFrequency} Hz
                                </Typography>
                                <Typography>
                                    Scale: {currentUniverse.harmonyParams.scale}
                                </Typography>
                                <Typography>
                                    Tempo: {currentUniverse.harmonyParams.tempo} BPM
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                <Box sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="New Story Point"
                        value={storyPoint}
                        onChange={(e) => setStoryPoint(e.target.value)}
                    />
                    <Button
                        variant="contained"
                        onClick={handleAddStoryPoint}
                        sx={{ mt: 2 }}
                        disabled={!storyPoint}
                    >
                        Add Story Point
                    </Button>
                </Box>

                <Grid container spacing={3}>
                    {currentUniverse.storyPoints.map((point, index) => (
                        <Grid item xs={12} key={point.id}>
                            <Card>
                                <CardContent>
                                    <Typography
                                        variant="subtitle2"
                                        color="text.secondary"
                                        gutterBottom
                                    >
                                        Point {index + 1} - {new Date(point.timestamp).toLocaleString()}
                                    </Typography>
                                    <Typography>{point.content}</Typography>
                                    {point.harmonyTie && (
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Harmony State: {point.harmonyTie.frequency}Hz,{' '}
                                                {point.harmonyTie.tempo} BPM, {point.harmonyTie.scale}
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </TabPanel>

            <Box sx={{ mt: 4 }}>
                <Button
                    variant="contained"
                    onClick={() => handleExport('json')}
                    sx={{ mr: 2 }}
                >
                    Export as JSON
                </Button>
                <Button variant="contained" onClick={() => handleExport('audio')}>
                    Export as Audio
                </Button>
            </Box>
        </Box>
    );
};

export default UniverseDetail;
