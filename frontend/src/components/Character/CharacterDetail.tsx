import { useAppDispatch, useAppSelector } from "../../hooks/useSetterToolbox";
import type { ComponentStatus } from "../../types/componentStatus";
import { useState, useEffect, useMemo } from "react";
import { useSetterToolbox } from "../../hooks/useSetterToolbox";
import { useNavigate } from "react-router-dom";
import { useModalToolbox } from "../../hooks/useModalToolbox";
import { setCurrentUniverse } from "../../features/Universe/universeSlice";
import type { Universe } from "../../types/universe";
import type { Note } from "../../types/note";
import type { AppLocation } from "../../types/location";
import { setCurrentNote } from "../../features/Note/noteSlice";
import { setCurrentLocation } from "../../features/Location/locationSlice";
import { Spinner } from "../Universal/Spinner";
import { ErrorDisplay } from "../Universal/ErrorDisplay";
import { getCharacter } from "../../features/Character/characterActions";
import { EmptyState } from "../Universal/EmptyState";
import { EntityManager } from "../Universal/EntityManager";
import { GenericModal } from "../Universal/GenericModal";



export const CharacterDetail = () => {

    const { currentCharacter, error: charError, isLoading: charLoading } = useAppSelector((state) => state.character)
    const [uniStatus, setUniStatus] = useState<ComponentStatus>('idle');
    const [charStatus, setCharStatus] = useState<ComponentStatus>('idle');
    const [noteStatus, setNoteStatus] = useState<ComponentStatus>('idle');
    const [locStatus, setLocStatus] = useState<ComponentStatus>('idle');
    const { useBooleanSetter } = useSetterToolbox()
    const { boolean: isModalOpen, setTrue: openModal, setFalse: closeModal } = useBooleanSetter(false);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [activeModal, setActiveModal] = useState<{ item: any | null, type:'location' | 'universe' | 'character' | 'note' | '' }>({ item: null, type: '' });
    const currentToolbox = useModalToolbox(activeModal.item, activeModal.type);

    const character_id = currentCharacter?.character_id;


    const handleCreate = (type:'location' | 'universe' | 'character' | 'note' | '') => {
        setActiveModal({ type, item: null });
        currentToolbox.reset();
        openModal();
    }

    const handleEdit = (type: 'location' | 'universe' | 'character' | 'note' | '', item: any) => {
        setActiveModal({ type, item });
        openModal();
    }

    const handleDelete = (type:'location' | 'universe' | 'character' | 'note' | '', item: any) => {
        setActiveModal({type, item});
        currentToolbox.handleDelete(item);
    }

    const handleUniverseEnter = (e: React.MouseEvent, universe: Universe) => {
        e.stopPropagation();
        dispatch(setCurrentUniverse(universe));
        navigate(`universes/${universe.universe_id}`);
    }

    const handleNoteEnter = (e: React.MouseEvent, note: Note) => {
        e.stopPropagation();
        dispatch(setCurrentNote(note));
        navigate(`/notes/${note.note_id}`);
    }

    const handleLocationEnter = (e: React.MouseEvent, location: AppLocation) => {
        e.stopPropagation();
        dispatch(setCurrentLocation(location));
        navigate(`locations/${location.location_id}`);
    }

    const linkedUniverses = useMemo(() => {
        return currentCharacter?.universes || [];
    }, [currentCharacter]);

    const linkedNotes = useMemo(() => {
        return currentCharacter?.notes || [];
    }, [currentCharacter]);

    const linkedLocations = useMemo(() => {
        return currentCharacter?.locations || [];
    }, [currentCharacter]);


    useEffect(() => {
        if (charLoading) {
            setCharStatus('loading')
            return;
        }
        if (charError) {
            setCharStatus('error')
            return;
        }
        if (!currentCharacter) {
            setCharStatus('empty')
            return;
        }
        setCharStatus('success');
        setUniStatus(currentCharacter?.universes?.length ? 'success' : 'empty');
        setNoteStatus(currentCharacter?.notes?.length ? 'success' : 'empty');
        setLocStatus(currentCharacter?.locations?.length ? 'success' : 'empty');

    }, [charLoading, charError, currentCharacter])


    return (

        <main>

            {charStatus === 'loading' && <Spinner />}
            {charStatus === 'error' && charError && <ErrorDisplay
                message={charError}
                onRetry={() => character_id && dispatch(getCharacter(character_id))}
            />}
            {charStatus === 'empty' && <EmptyState type={'character'} onAdd={() => handleCreate('character')} />}
            {charStatus === 'success' && (
                <>
                    <h1>{currentCharacter?.name}</h1>
                    <EntityManager
                        type="universe"
                        isSection={true}
                        data={linkedUniverses}
                        error={charError}
                        status={uniStatus}
                        onAdd={() => handleCreate("universe")}
                        onDelete={(universe) => handleDelete('universe', universe)}
                        onEdit={(item: Universe) => handleEdit("universe", item)}
                        onEnter={handleUniverseEnter}
                        onRetry={() => character_id && dispatch(getCharacter(character_id))}
                        idField="universe_id"
                        renderCardContent={(u) => (
                            <>

                                <h3>{u.name}</h3>
                                <p>{u.description?.substring(30)}</p>
                            </>
                        )}
                    />

                    <EntityManager
                        type="note"
                        isSection={true}
                        data={linkedNotes}
                        error={charError}
                        status={noteStatus}
                        onAdd={() => handleCreate("note")}
                        onEdit={(item: Note) => handleEdit("note", item)}
                        onDelete={(note) => handleDelete('note', note)}
                        onEnter={handleNoteEnter}
                        onRetry={() => character_id && dispatch(getCharacter(character_id))}
                        idField="note_id"
                        renderCardContent={(n) => (
                            <>
                                <h3>{n.title}</h3>
                                <p>Content:{n.content || '...'}</p>
                            </>
                        )}
                    />
                    <EntityManager
                        type="location"
                        isSection={true}
                        data={linkedLocations}
                        error={charError}
                        status={locStatus}
                        onAdd={() => handleCreate("location")}
                        onEdit={(item: AppLocation) => handleEdit("location", item)}
                        onDelete={(location) => handleDelete('location', location)}
                        onEnter={handleLocationEnter}
                        onRetry={() => character_id && dispatch(getCharacter(character_id))}
                        idField="location_id"
                        renderCardContent={(l) => (
                            <>
                                <h3>{l.name}</h3>
                                <p>Description: {l.description || '...'}</p>
                            </>
                        )}
                    />
                    {
                        activeModal.type !== '' && (

                            <GenericModal
                                isOpen={isModalOpen}
                                onClose={closeModal}
                                type={activeModal.type}
                                toolbox={currentToolbox}
                                item={activeModal.item}
                            />
                        )
                    }

                </>
            )}


        </main>


    )
}