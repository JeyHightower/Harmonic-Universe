import { usePhysicsEngine } from '@hooks/usePhysicsEngine';
import { Box, Grid, Paper } from '@mui/material';
import { OrbitControls, Stats } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { useRef, useState } from 'react';
import ObjectList from './ObjectList';
import PropertiesPanel from './PropertiesPanel';
import Scene, { SceneHandle } from './Scene';
import SimulationControls from './SimulationControls';

const PhysicsWorkspace: React.FC = () => {
    const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [timeStep, setTimeStep] = useState(1 / 60);
    const physicsEngine = usePhysicsEngine();
    const sceneRef = useRef(null);

    const handleObjectSelect = (objectId: number) => {
        setSelectedObjectId(objectId);
    };

    const handleSimulationToggle = () => {
        if (isSimulating) {
            physicsEngine.pause();
        } else {
            physicsEngine.start();
        }
        setIsSimulating(!isSimulating);
    };

    const handleTimeStepChange = (step: number) => {
        setTimeStep(step);
        if (physicsEngine.setTimeStep) {
            physicsEngine.setTimeStep(step);
        }
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <SimulationControls
                isSimulating={isSimulating}
                timeStep={timeStep}
                onSimulationToggle={handleSimulationToggle}
                onTimeStepChange={handleTimeStepChange}
            />
            <Grid container spacing={2} sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <Grid item xs={3}>
                    <Paper sx={{ height: '100%', overflow: 'auto' }}>
                        <ObjectList
                            selectedObjectId={selectedObjectId}
                            onObjectSelect={handleObjectSelect}
                        />
                    </Paper>
                </Grid>
                <Grid item xs={6}>
                    <Paper
                        sx={{
                            height: '100%',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <Canvas
                            camera={{ position: [5, 5, 5], fov: 75 }}
                            style={{ flexGrow: 1 }}
                        >
                            <Scene ref={sceneRef} isSimulating={isSimulating} />
                            <OrbitControls />
                            <ambientLight intensity={0.5} />
                            <directionalLight position={[10, 10, 5]} intensity={1} />
                            <gridHelper args={[20, 20]} />
                            <axesHelper args={[5]} />
                            {process.env.NODE_ENV === 'development' && <Stats />}
                        </Canvas>
                    </Paper>
                </Grid>
                <Grid item xs={3}>
                    <Paper sx={{ height: '100%', overflow: 'auto' }}>
                        <PropertiesPanel
                            objectId={selectedObjectId}
                            isSimulating={isSimulating}
                        />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PhysicsWorkspace;
