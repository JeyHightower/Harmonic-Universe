import { usePhysicsEngine } from '@hooks/usePhysicsEngine';
import { useFrame } from '@react-three/fiber';
import React, { useEffect, useRef } from 'react';
import { Mesh } from 'three';


const PhysicsObject: React.FC = ({ object, isSimulating }) => {
    const meshRef = useRef(null);
    const physicsEngine = usePhysicsEngine();

    useEffect(() => {
        if (meshRef.current) {
            // Register object with physics engine
            physicsEngine.addObject(object.id, {
                mesh: meshRef.current,
                ...object.physics,
                mass: object.mass,
            });

            return () => {
                physicsEngine.removeObject(object.id);
            };
        }
    }, [object.id]);

    useFrame(() => {
        if (meshRef.current && isSimulating) {
            // Update mesh position/rotation from physics engine
            const transform = physicsEngine.getObjectTransform(object.id);
            if (transform) {
                meshRef.current.position.copy(transform.position);
                meshRef.current.quaternion.copy(transform.quaternion);
            }
        }
    });

    const renderGeometry = () => {
        switch (object.type) {
            case 'box':
                return <boxGeometry args={object.scale} />;
            case 'sphere':
                return <sphereGeometry args={[object.scale[0], 32, 32]} />;
            case 'cylinder':
                return <cylinderGeometry args={[object.scale[0], object.scale[0], object.scale[1], 32]} />;
            default:
                return <boxGeometry args={[1, 1, 1]} />;
        }
    };

    return (
        <mesh
            ref={meshRef}
            position={object.position}
            rotation={object.rotation}
            scale={object.scale}
        >
            {renderGeometry()}
            <meshStandardMaterial
                color={object.material.color}
                metalness={object.material.metalness || 0}
                roughness={object.material.roughness || 1}
            />
        </mesh>
    );
};

export default PhysicsObject;
