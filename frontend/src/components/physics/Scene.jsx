import { usePhysicsEngine } from '@hooks/usePhysicsEngine';
import { useFrame } from '@react-three/fiber';
import { useAppSelector } from '@store/store';
import { forwardRef, useEffect, useImperativeHandle } from 'react';
import PhysicsObject from './PhysicsObject';


export interface SceneHandle {
    reset: () => void;
    getObjectPositions: () => Record<number, [number, number, number]>;
}

const Scene = forwardRef<SceneHandle, SceneProps>(({ isSimulating }, ref) => {
    const physicsEngine = usePhysicsEngine();
    const objects = useAppSelector(state => state.physics.objects);
    const constraints = useAppSelector(state => state.physics.constraints);

    useEffect(() => {
        const world = physicsEngine.init();
        return () => {
            if (physicsEngine.cleanup) {
                physicsEngine.cleanup();
            }
        };
    }, []);

    useImperativeHandle(ref, () => ({
        reset: () => {
            if (physicsEngine.reset) {
                physicsEngine.reset();
            }
        },
        getObjectPositions: () => {
            const positions = physicsEngine.getObjectPositions();
            return Object.fromEntries(
                Object.entries(positions).map(([id, pos]) => [
                    Number(id),
                    pos as [number, number, number],
                ])
            );
        },
    }));

    useFrame((state, delta) => {
        if (isSimulating) {
            physicsEngine.step(delta);
        }
    });

    return (
        
            {objects.map((object) => (
                <PhysicsObject
                    key={object.id}
                    {...object}
                />
            ))}
            {/* Visualization of constraints would go here */}
        </group>
    );
});

Scene.displayName = 'Scene';

export default Scene;
