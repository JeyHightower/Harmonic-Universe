import { useAppDispatch, useAppSelector, useSetterToolbox } from '../../hooks/useSetterToolbox';
import type { Universe } from '../../types/universe';
import { useState, useEffect } from 'react';
import { useModalToolbox } from '../../hooks/useModalToolbox';
import { GenericModal } from '../Universal/GenericModal';
import { type ComponentStatus } from '../../types/componentStatus';
import { getAllUniverses } from '../../features/Universe/universeActions';

import { useNavigate } from 'react-router-dom';
import { setCurrentUniverse } from '../../features/Universe/universeSlice';
import { EntityManager } from '../Universal/EntityManager';

export const Universes = () => {
    const { allUniverses, isLoading, error } = useAppSelector((state) => state.universe);
    const [selectedUniverse, setSelectedUniverse] = useState<Universe | null>(null);
    const { useBooleanSetter } = useSetterToolbox();
    const universeModal = useBooleanSetter(false);
    const universeModalInfo = useModalToolbox(selectedUniverse || {}, 'universe');
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const [status, setStatus] = useState<ComponentStatus>('idle');


    useEffect(() => {
        if (isLoading) {
            setStatus('loading')
        } else if (error) {
            setStatus('error')
        } else if (allUniverses.length === 0) {
            setStatus('empty')
        } else {
            setStatus('success')
        }
    }, [isLoading, error, allUniverses])

    const handleUniverseEnter = (e: React.MouseEvent, universe: Universe) => {
        e.stopPropagation();
        dispatch(setCurrentUniverse(universe));
        navigate(`/universes/${universe.universe_id}`);

    }


    const universeHandleCreate = () => {
        setSelectedUniverse(null);
        universeModalInfo.reset();
        universeModal.setTrue();

    }

    const universeHandleEdit = (universe: Universe) => {
        setSelectedUniverse(universe);
        universeModal.setTrue();
    }

    return (
        <>
            <EntityManager
                type="universe"
                data={allUniverses}
                status={status}
                error={error}
                onAdd={universeHandleCreate}
                onEdit={universeHandleEdit}
                onEnter={handleUniverseEnter}
                onRetry={() => dispatch(getAllUniverses())}
                idField="universe_id"
                renderCardContent ={(u) => (
                    <>
                    <h3>{u.name}</h3>
                    <p>{u.description?.substring(100)}</p>
                    </>
                )}
                />
            <GenericModal
                type="universe"
                isOpen={universeModal.boolean}
                onClose={universeModal.setFalse}
                toolbox={universeModalInfo}
                item={selectedUniverse}
            />


        </>

    );

};