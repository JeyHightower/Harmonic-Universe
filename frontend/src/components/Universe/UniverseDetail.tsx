import { useAppDispatch, useAppSelector, useSetterToolbox } from "../../hooks/useSetterToolbox"
import type { ComponentStatus } from "../../types/componentStatus";
import { useState, useEffect, useMemo } from "react";
import { useModalToolbox } from "../../hooks/useModalToolbox";
import type { Character } from "../../types/character";
import { useNavigate } from "react-router-dom";
import { setCurrentCharacter } from "../../features/Character/characterSlice";
import type { Note } from "../../types/note";
import { setCurrentNote } from "../../features/Note/noteSlice";
import { getAllLocationsInUniverse, setCurrentLocation } from "../../features/Location/locationSlice";
import type { AppLocation } from "../../types/location";
import { EntityManager } from "../Universal/EntityManager";
import { GenericModal } from "../Universal/GenericModal";
import { Spinner } from "../Universal/Spinner";
import { ErrorDisplay } from "../Universal/ErrorDisplay";
import { EmptyState } from "../Universal/EmptyState";
import { getUniverse } from "../../features/Universe/universeActions";


export const UniverseDetail = () => {
    const { currentUniverse, error: uniError, isLoading: uniLoading } = useAppSelector((state) => state.universe);
    const [uniStatus, setUniStatus] = useState<ComponentStatus>('idle');
    const [charStatus, setCharStatus] = useState<ComponentStatus>('idle');
    const [noteStatus, setNoteStatus] = useState<ComponentStatus>('idle');
    const [locStatus, setLocStatus] = useState<ComponentStatus>('idle');
    const { useBooleanSetter } = useSetterToolbox();
    const { boolean: isModalOpen, setTrue: openModal, setFalse: closeModal } = useBooleanSetter(false);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [activeModal, setActiveModal] = useState<{ item: any | null, type: 'location' | 'universe' | 'character' | 'note' | '' }>({ type: '', item: null });
    const currentToolbox = useModalToolbox(activeModal.item, activeModal.type);

    const universe_id = currentUniverse?.universe_id;


    const handleCreate = (type: 'location' | 'universe' | 'character' | 'note' | '') => {
        setActiveModal({ type, item: null })
        currentToolbox.reset();
        openModal();
    }

    const handleEdit = (type: 'location' | 'universe' | 'character' | 'note' | '', item: any) => {
        setActiveModal({ type, item })
        openModal();
    }

    const handleDelete = (type:'location' | 'universe' | 'character' | 'note' | '', item: any) => {
        setActiveModal({type, item});
        currentToolbox.handleDelete(item);
    }


    const handleCharacterEnter = (e: React.MouseEvent, character: Character) => {
        e.stopPropagation();
        dispatch(setCurrentCharacter(character));
        navigate(`/characters/${character.character_id}`)
    }

    const handleNoteEnter = (e: React.MouseEvent, note: Note) => {
        e.stopPropagation();
        dispatch(setCurrentNote(note));
        navigate(`/notes/${note.note_id}`)
    }

    const handleLocationEnter = (e: React.MouseEvent, location: AppLocation) => {
        e.stopPropagation();
        dispatch(setCurrentLocation(location));
        navigate(`/locations/${location.location_id}`)
    }



    const linkedCharacters = useMemo(() => {
        return currentUniverse?.characters || [];
    }, [currentUniverse]);

    const linkedNotes = useMemo(() => {
        return currentUniverse?.notes || [];
    }, [currentUniverse])

    const linkedLocations = useMemo(() => {
        return currentUniverse?.locations || [];
    }, [currentUniverse]
    );

    useEffect(() => {
        if (uniLoading) {
            setUniStatus('loading')
            return;
        }
        if (uniError) {
            setUniStatus('error')
            return;
        }
        if (!currentUniverse) {
            setUniStatus('empty')
            return;
        }
        setUniStatus('success')
        setCharStatus(currentUniverse.characters?.length ? 'success' : 'empty')
        setNoteStatus(currentUniverse.notes?.length ? 'success' : 'empty')
        setLocStatus(currentUniverse.locations?.length ? 'success' : 'empty')

    }, [uniLoading, uniError, currentUniverse])

    return (

        <main>
            {uniStatus === 'loading' && <Spinner />}
            {uniStatus === 'error' && uniError && <ErrorDisplay
                message={uniError}
                onRetry={() => universe_id && dispatch(getUniverse(universe_id))}
            />
            }
            {uniStatus === 'empty' && <EmptyState type={'universe'} onAdd={() => handleCreate("universe")} />}

            {uniStatus === 'success' && (
                <>
                    <h1>{currentUniverse?.name}</h1>
                    <EntityManager
                        type="character"
                        isSection={true}
                        data={linkedCharacters}
                        error={uniError}
                        status={charStatus}
                        onAdd={() => handleCreate("character")}
                        onEdit={(item: Character) => handleEdit("character", item)}
                        onDelete={(character) => handleDelete('character', character)}
                        onEnter={handleCharacterEnter}
                        onRetry={() => universe_id && dispatch(getUniverse(universe_id))}
                        idField="character_id"
                        renderCardContent={(c) => (
                            <>
                                <h3>{c.name}</h3>
                                <p>Age:{c.age || 'Unknown'}</p>
                            </>
                        )}
                    />
                    <EntityManager
                        type="note"
                        isSection={true}
                        data={linkedNotes}
                        status={noteStatus}
                        error={uniError}
                        onAdd={() => handleCreate("note")}
                        onEdit={(item: Note) => handleEdit("note", item)}
                        onDelete={(note) => handleDelete('note', note)}
                        onEnter={handleNoteEnter}
                        onRetry={() => universe_id && dispatch(getUniverse(universe_id))}
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
                        status={locStatus}
                        error={uniError}
                        onAdd={() => handleCreate("location")}
                        onEdit={(item: AppLocation) => handleEdit("location", item)}
                        onDelete={(location) => handleDelete('location', location)}
                        onEnter={handleLocationEnter}
                        onRetry={() => universe_id && dispatch(getAllLocationsInUniverse(universe_id))}
                        idField="location_id"
                        renderCardContent={(l) => (
                            <>
                                <h3>{l.name}</h3>
                                <p>Description: {l.description || '...'}</p>
                            </>
                        )}
                    />
                </>)}
                {
                activeModal.type !== '' && (
            <GenericModal
                isOpen={isModalOpen}
                onClose={closeModal}
                type={activeModal.type}
                toolbox={currentToolbox}
                item={activeModal.item}
            />
                )}
        </main>
    )

}
















