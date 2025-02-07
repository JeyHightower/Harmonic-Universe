import { usePhysicsEngine } from '@hooks/usePhysicsEngine';
import { useFrame } from '@react-three/fiber';
import { RootState } from '@store/index';
import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { useSelector } from 'react-redux';
import PhysicsObject from './PhysicsObject';

interface SceneProps {
    isSimulating: boolean;
}

export interface SceneHandle {
    reset: () => void;
    getObjectPositions: () => { [key: number]: [number, number, number] };
}

const Scene = forwardRef<SceneHandle, SceneProps>(({ isSimulating }, ref) => {
    const physicsEngine = usePhysicsEngine();
    const objects = useSelector((state: RootState) => state.physics.objects);
    const constraints = useSelector((state: RootState) => state.physics.constraints);

    useEffect(() => {
        // Initialize physics world
        physicsEngine.init();

        return () => {
            physicsEngine.cleanup();
        };
    }, []);

    useImperativeHandle(ref, () => ({
        reset: () => {
            physicsEngine.reset();
        },
        getObjectPositions: () => {
            return physicsEngine.getObjectPositions();
        },
    }));

    useFrame((state, delta) => {
        if (isSimulating) {
            physicsEngine.step(delta);
        }
    });

    return (
        <group>
            {objects.map((object) => (
                <PhysicsObject
                    key={object.id}
                    object={object}
                    isSimulating={isSimulating}
                />
            ))}
            {/* Visualization of constraints would go here */}
        </group>
    );
});

Scene.displayName = 'Scene';

export default Scene;
