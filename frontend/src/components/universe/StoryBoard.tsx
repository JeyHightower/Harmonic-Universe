import { Universe } from '@/store/slices/universeSlice';
import {
    Add as AddIcon,
    MusicNote as MusicNoteIcon,
    PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import React, { useCallback, useState } from 'react';

interface StoryBoardProps {
    universe: Universe;
    onAddStoryPoint: (
        universeId: number,
        storyPoint: Omit<Universe['storyPoints'][0], 'id' | 'timestamp'>
    ) => void;
}

export const StoryBoard: React.FC<StoryBoardProps> = ({ universe, onAddStoryPoint }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [content, setContent] = useState('');

    const handleAddStoryPoint = useCallback(() => {
        onAddStoryPoint(universe.id, {
            content,
            harmonyTie: {
                frequency: universe.harmonyParams.baseFrequency,
                tempo: universe.harmonyParams.tempo,
                scale: universe.harmonyParams.scale,
            },
        });
        setContent('');
        setIsDialogOpen(false);
    }, [universe, content, onAddStoryPoint]);

    const handlePlayHarmony = useCallback(
        (storyPoint: Universe['storyPoints'][0]) => {
            // This would integrate with Tone.js to play the harmony tied to this story point
            console.log('Playing harmony for story point:', storyPoint);
        },
        []
    );

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Story Points</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setIsDialogOpen(true)}
                >
                    Add Story Point
                </Button>
            </Box>

            <Grid container spacing={3}>
                {universe.storyPoints.map((point, index) => (
                    <Grid item xs={12} key={point.id}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="subtitle1" color="text.secondary">
                                        Point {index + 1}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {new Date(point.timestamp).toLocaleString()}
                                    </Typography>
                                </Box>
                                <Typography variant="body1">{point.content}</Typography>
                                {point.harmonyTie && (
                                    <>
                                        <Divider sx={{ my: 2 }} />
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                            }}
                                        >
                                            <MusicNoteIcon color="primary" />
                                            <Typography variant="body2" color="text.secondary">
                                                {point.harmonyTie.scale} at{' '}
                                                {point.harmonyTie.frequency}Hz,{' '}
                                                {point.harmonyTie.tempo} BPM
                                            </Typography>
                                        </Box>
                                    </>
                                )}
                            </CardContent>
                            <CardActions>
                                <Tooltip title="Play harmony">
                                    <IconButton
                                        size="small"
                                        onClick={() => handlePlayHarmony(point)}
                                    >
                                        <PlayArrowIcon />
                                    </IconButton>
                                </Tooltip>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Story Point</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Story Point Content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                        Current harmony parameters will be tied to this story point
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddStoryPoint} disabled={!content} variant="contained">
                        Add
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
