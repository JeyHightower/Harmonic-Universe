import { Universe } from '@/store/slices/universeSlice';
import {
    PlayArrow as PlayArrowIcon,
    Save as SaveIcon,
    Stop as StopIcon,
} from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    IconButton,
    Slider,
    Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import * as Tone from 'tone';

interface UniverseHarmonyProps {
    universe: Universe;
    onExport: () => void;
    socket: Socket | null;
}

export const UniverseHarmony: React.FC<UniverseHarmonyProps> = ({
    universe,
    onExport,
    socket,
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const synthRef = useRef<Tone.PolySynth | null>(null);
    const sequenceRef = useRef<Tone.Sequence | null>(null);

    useEffect(() => {
        // Initialize Tone.js synth with effects
        const reverb = new Tone.Reverb({ decay: 5, wet: 0.3 }).toDestination();
        const delay = new Tone.FeedbackDelay('8n', 0.3).connect(reverb);
        const synth = new Tone.PolySynth(Tone.Synth).connect(delay);
        synthRef.current = synth;

        return () => {
            synth.dispose();
            delay.dispose();
            reverb.dispose();
            if (sequenceRef.current) {
                sequenceRef.current.dispose();
            }
        };
    }, []);

    const generateScale = useCallback((baseFreq: number) => {
        const ratios = [1, 9 / 8, 5 / 4, 4 / 3, 3 / 2, 5 / 3, 15 / 8, 2]; // Major scale ratios
        return ratios.map(ratio => baseFreq * ratio);
    }, []);

    const generateHarmony = useCallback(() => {
        if (!synthRef.current) return;

        // Base frequency modulation based on gravity
        const baseFreq = universe.harmonyParams.baseFrequency * (universe.physicsParams.gravity / 9.81);
        const scale = generateScale(baseFreq);

        // Tempo modulation based on time dilation
        const tempo = universe.harmonyParams.tempo / universe.physicsParams.timeDilation;
        Tone.Transport.bpm.value = tempo;

        // Energy affects harmony complexity
        const energy = Object.values(universe.physicsParams).reduce((sum, val) => sum + val, 0) /
            Object.keys(universe.physicsParams).length;

        // Generate chord progression based on parameters
        const progression = [
            [scale[0], scale[2], scale[4]], // I
            [scale[5], scale[0], scale[2]], // VI
            [scale[3], scale[5], scale[0]], // IV
            [scale[4], scale[6], scale[1]], // V
        ];

        // Create sequence with dynamic note length based on energy
        if (sequenceRef.current) {
            sequenceRef.current.dispose();
        }

        const noteLength = energy < 0.5 ? '4n' : '8n';
        const sequence = new Tone.Sequence(
            (time, chord) => {
                synthRef.current?.triggerAttackRelease(chord, noteLength, time);
            },
            progression,
            noteLength
        );

        // Set volume based on universe parameters
        synthRef.current.volume.value = Tone.gainToDb(universe.harmonyParams.volume);

        sequenceRef.current = sequence;
        sequence.start(0);
    }, [universe.harmonyParams, universe.physicsParams, generateScale]);

    // Handle real-time physics updates
    useEffect(() => {
        if (socket) {
            socket.on('physics_changed', (data) => {
                if (isPlaying) {
                    generateHarmony();
                }
            });
        }
    }, [socket, isPlaying, generateHarmony]);

    const handlePlayStop = useCallback(async () => {
        if (isPlaying) {
            Tone.Transport.stop();
            if (sequenceRef.current) {
                sequenceRef.current.stop();
            }
            setIsPlaying(false);
        } else {
            await Tone.start();
            Tone.Transport.start();
            generateHarmony();
            setIsPlaying(true);
        }
    }, [isPlaying, generateHarmony]);

    const handleHarmonyChange = useCallback((param: keyof Universe['harmonyParams'], value: number) => {
        if (isPlaying) {
            generateHarmony();
        }
    }, [isPlaying, generateHarmony]);

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Harmony Parameters
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                                Base Frequency
                            </Typography>
                            <Slider
                                value={universe.harmonyParams.baseFrequency}
                                min={220}
                                max={880}
                                step={1}
                                onChange={(_, value) => handleHarmonyChange('baseFrequency', value as number)}
                                valueLabelDisplay="auto"
                                marks={[
                                    { value: 220, label: 'A3' },
                                    { value: 440, label: 'A4' },
                                    { value: 880, label: 'A5' },
                                ]}
                            />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                                Tempo
                            </Typography>
                            <Slider
                                value={universe.harmonyParams.tempo}
                                min={60}
                                max={180}
                                step={1}
                                onChange={(_, value) => handleHarmonyChange('tempo', value as number)}
                                valueLabelDisplay="auto"
                                marks={[
                                    { value: 60, label: 'Slow' },
                                    { value: 120, label: 'Medium' },
                                    { value: 180, label: 'Fast' },
                                ]}
                            />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                                Volume
                            </Typography>
                            <Slider
                                value={universe.harmonyParams.volume}
                                min={0}
                                max={1}
                                step={0.01}
                                onChange={(_, value) => handleHarmonyChange('volume', value as number)}
                                valueLabelDisplay="auto"
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <IconButton
                    size="large"
                    onClick={handlePlayStop}
                    color={isPlaying ? 'secondary' : 'primary'}
                >
                    {isPlaying ? <StopIcon /> : <PlayArrowIcon />}
                </IconButton>
                <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={onExport}
                >
                    Export Harmony
                </Button>
            </Box>
        </Box>
    );
};
