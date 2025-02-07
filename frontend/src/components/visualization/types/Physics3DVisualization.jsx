import { usePhysicsEngine } from '@hooks/usePhysicsEngine';
import { useFrame } from '@react-three/fiber';
import { RootState } from '@store/index';
import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';


const Physics3DVisualization: React.FC<Physics3DVisualizationProps> = ({
    settings,
    isRealTime,
    updateInterval,
}) => {
    const physicsEngine = usePhysicsEngine();
    const objects = useSelector((state: RootState) => state.physics.objects);
    const constraints = useSelector((state: RootState) => state.physics.constraints);
    const groupRef = useRef<THREE.Group>(null);

    useEffect(() => {
        // Initialize physics world
        physicsEngine.init();

        return () => {
            physicsEngine.cleanup();
        };
    }, []);

    useFrame((state, delta) => {
        if (isRealTime) {
            physicsEngine.step(delta);

            // Update object positions
            objects.forEach((object) => {
                const transform = physicsEngine.getObjectTransform(object.id);
                if (transform && groupRef.current) {
                    const mesh = groupRef.current.children.find(
                        (child) => child.userData.id === object.id
                    );
                    if (mesh) {
                        mesh.position.copy(transform.position);
                        mesh.quaternion.copy(transform.quaternion);
                    }
                }
            });
        }
    });

    const renderObject = (object: any) => {
        switch (object.type) {
            case 'box':
                return (
                    <mesh
                        key={object.id}
                        position={object.position}
                        rotation={object.rotation}
                        scale={object.scale}
                        userData={{ id: object.id }}
                    >
                        <boxGeometry />
                        <meshStandardMaterial
                            color={object.material.color}
                            metalness={object.material.metalness || 0}
                            roughness={object.material.roughness || 1}
                        />
                    </mesh>
                );
            case 'sphere':
                return (
                    <mesh
                        key={object.id}
                        position={object.position}
                        rotation={object.rotation}
                        scale={object.scale}
                        userData={{ id: object.id }}
                    >
                        <sphereGeometry args={[1, 32, 32]} />
                        <meshStandardMaterial
                            color={object.material.color}
                            metalness={object.material.metalness || 0}
                            roughness={object.material.roughness || 1}
                        />
                    </mesh>
                );
            case 'cylinder':
                return (
                    <mesh
                        key={object.id}
                        position={object.position}
                        rotation={object.rotation}
                        scale={object.scale}
                        userData={{ id: object.id }}
                    >
                        <cylinderGeometry args={[1, 1, 1, 32]} />
                        <meshStandardMaterial
                            color={object.material.color}
                            metalness={object.material.metalness || 0}
                            roughness={object.material.roughness || 1}
                        />
                    </mesh>
                );
            default:
                return null;
        }
    };

    const renderConstraint = (constraint: any) => {
        const objectA = objects.find((obj) => obj.id === constraint.objectA);
        const objectB = objects.find((obj) => obj.id === constraint.objectB);

        if (!objectA || !objectB) return null;

        // Render a line between constrained objects
        return (
            <line key={constraint.id}>
                
                    <bufferAttribute
                        attach="attributes-position"
                        count={2}
                        array={new Float32Array([
                            ...objectA.position,
                            ...objectB.position,
                        ])}
                        itemSize={3}
                    />
                </bufferGeometry>
                <lineBasicMaterial color="#ff0000" />
            </line>
        );
    };

    return (
        <group ref={groupRef}>
            {objects.map(renderObject)}
            {constraints.map(renderConstraint)}
        </group>
    );
};

export default Physics3DVisualization;
