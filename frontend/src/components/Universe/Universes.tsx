import { useAppDispatch, useAppSelector } from '../../hooks/useSetterToolbox';
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
    const [activeModal, setActiveModal] = useState<{item:Universe | null, type:string}>({item:null, type:''});
    const universeModalInfo = useModalToolbox(activeModal.item || {}, 'universe');
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [status, setStatus] = useState<ComponentStatus>('idle');


    useEffect(() => {
        if (isLoading) {
            setStatus('loading')
            return;
        }

        if (error) {
            setStatus('error')
            return;
        }
        if (allUniverses?.length === 0) {
            setStatus('empty')
            return;
        }
        
        setStatus('success')
    }, [isLoading, error, allUniverses])

    const handleUniverseEnter = (e: React.MouseEvent, universe: Universe) => {
        e.stopPropagation();
        dispatch(setCurrentUniverse(universe));
        navigate(`/universes/${universe.universe_id}`);

    }


    const universeHandleCreate = () => {
        setActiveModal({item:null, type:'universe'});
        universeModalInfo.reset();
        

    }

    const universeHandleEdit = (universe: Universe) => {
        setActiveModal({item:universe, type:'universe'});
    }

    const handleClose = () => {
        setActiveModal({item:null, type:''});
    }

    return (
        <>
            <EntityManager
                type="universe"
                data={allUniverses}
                status={status}
                error={error}
                onAdd={() => universeHandleCreate()}
                onEdit={(universe) => universeHandleEdit(universe)}
                onEnter={(e, universe) => handleUniverseEnter(e,universe)}
                onRetry={() => dispatch(getAllUniverses())}
                idField="universe_id"
                renderCardContent={(u) => (
                
                    <>
                        <h3>{u?.name}</h3>
                        <p>{u?.description?.substring(30)}</p>
                    </>
                )}
            />
            <GenericModal
                type="universe"
                isOpen={activeModal.type === 'universe'}
                onClose={handleClose}
                toolbox={universeModalInfo}
                item={activeModal.item}
            />


        </>

    );

};