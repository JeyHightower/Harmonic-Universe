
import { RootState } from '@store/index';
import { updateObject } from '@store/slices/physicsSlice';
import * as CANNON from 'cannon-es';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';


export const usePhysicsEngine = () => {
  const dispatch = useDispatch();
  const { objects, isSimulating, timeStep } = useSelector((state: RootState) => state.physics);
  const [engineContext, setEngineContext] = useState<PhysicsEngineContext | null>(null);
  const rafId = useRef();

  const init = useCallback(() => {
    const world = new CANNON.World();
    world.gravity.set(0, -9.81, 0);
    world.solver.iterations = 10;
    world.broadphase = new CANNON.NaiveBroadphase();

    setEngineContext({
      world,
      bodies: new Map(),
    });

    return { world };
  }, []);

  const createBody = useCallback(
    (object: PhysicsObject) => {
      if (!engineContext) return;

      const shape = (() => {
        switch (object.type) {
          case 'box':
            return new CANNON.Box(
              new CANNON.Vec3(object.scale[0] / 2, object.scale[1] / 2, object.scale[2] / 2)
            );
          case 'sphere':
            return new CANNON.Sphere(object.scale[0] / 2);
          case 'cylinder':
            return new CANNON.Cylinder(
              object.scale[0] / 2,
              object.scale[0] / 2,
              object.scale[1],
              16
            );
          default:
            return new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
        }
      })();

      const body = new CANNON.Body({
        mass: object.mass,
        position: new CANNON.Vec3(...object.position),
        quaternion: new CANNON.Quaternion().setFromEuler(...object.rotation),
        material: new CANNON.Material({
          friction: object.physics.friction,
          restitution: object.physics.restitution,
        }),
      });

      body.addShape(shape);
      engineContext.world.addBody(body);
      engineContext.bodies.set(object.id, body);

      return body;
    },
    [engineContext]
  );

  const removeBody = useCallback(
    (objectId: number) => {
      if (!engineContext) return;

      const body = engineContext.bodies.get(objectId);
      if (body) {
        engineContext.world.removeBody(body);
        engineContext.bodies.delete(objectId);
      }
    },
    [engineContext]
  );

  const step = useCallback(() => {
    if (!engineContext || !isSimulating) return;

    engineContext.world.step(timeStep);

    engineContext.bodies.forEach((body, objectId) => {
      dispatch(
        updateObject({
          id: objectId,
          position: [body.position.x, body.position.y, body.position.z],
          rotation: [body.quaternion.x, body.quaternion.y, body.quaternion.z],
        })
      );
    });

    rafId.current = requestAnimationFrame(step);
  }, [dispatch, engineContext, isSimulating, timeStep]);

  useEffect(() => {
    if (!engineContext) return;

    // Add/update bodies for all objects
    objects.forEach(object => {
      const existingBody = engineContext.bodies.get(object.id);
      if (!existingBody) {
        createBody(object);
      } else {
        // Update existing body properties
        existingBody.position.set(...object.position);
        existingBody.quaternion.setFromEuler(...object.rotation);
        existingBody.mass = object.mass;
        existingBody.material.friction = object.physics.friction;
        existingBody.material.restitution = object.physics.restitution;
      }
    });

    // Remove bodies for deleted objects
    engineContext.bodies.forEach((_, objectId) => {
      if (!objects.find(obj => obj.id === objectId)) {
        removeBody(objectId);
      }
    });
  }, [createBody, engineContext, objects, removeBody]);

  useEffect(() => {
    if (isSimulating) {
      rafId.current = requestAnimationFrame(step);
    } else if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [isSimulating, step]);

  useEffect(() => {
    return () => {
      if (engineContext) {
        engineContext.bodies.forEach(body => {
          engineContext.world.removeBody(body);
        });
        engineContext.bodies.clear();
      }
    };
  }, [engineContext]);

  return {
    init,
    step,
    reset: () => {
      if (engineContext) {
        engineContext.bodies.forEach(body => {
          body.position.set(0, 0, 0);
          body.velocity.set(0, 0, 0);
          body.angularVelocity.set(0, 0, 0);
          body.quaternion.set(0, 0, 0, 1);
        });
      }
    },
    start: () => {
      if (engineContext) {
        rafId.current = requestAnimationFrame(step);
      }
    },
    pause: () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    },
    cleanup: () => {
      if (engineContext) {
        engineContext.bodies.forEach(body => {
          engineContext.world.removeBody(body);
        });
        engineContext.bodies.clear();
      }
    },
    getObjectTransform: (objectId: number) => {
      if (!engineContext) return null;

      const body = engineContext.bodies.get(objectId);
      if (!body) return null;

      return {
        position: [body.position.x, body.position.y, body.position.z],
        rotation: [body.quaternion.x, body.quaternion.y, body.quaternion.z],
      };
    },
    getObjectPositions: () => {
      if (!engineContext) return {};

      const positions: Record<number, number[]> = {};
      engineContext.bodies.forEach((body, objectId) => {
        positions[objectId] = [body.position.x, body.position.y, body.position.z];
      });
      return positions;
    },
    objects,
  };
};
