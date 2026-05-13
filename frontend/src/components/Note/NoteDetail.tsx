import { useAppDispatch, useAppSelector, useSetterToolbox } from "../../hooks/useSetterToolbox";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setCurrentCharacter } from "../../features/Character/characterSlice";
import { setCurrentLocation } from "../../features/Location/locationSlice";
import { getNote, setCurrentNote } from "../../features/Note/noteSlice";
import { useModalToolbox } from "../../hooks/useModalToolbox";
import type { Character } from "../../types/character";
import type { ComponentStatus } from "../../types/componentStatus";
import type { AppLocation } from "../../types/location";
import type { Universe } from "../../types/universe";
import { EmptyState } from "../Universal/EmptyState";
import { EntityManager } from "../Universal/EntityManager";
import { ErrorDisplay } from "../Universal/ErrorDisplay";
import { GenericModal } from "../Universal/GenericModal";
import { Spinner } from "../Universal/Spinner";


export const NoteDetail = () => {

    const { currentNote, error: noteError, isLoading: noteLoading } = useAppSelector((state) => state.note);
    const [uniStatus, setUniStatus] = useState<ComponentStatus>('idle');
    const [charStatus, setCharStatus] = useState<ComponentStatus>('idle');
    const [noteStatus, setNoteStatus] = useState<ComponentStatus>('idle');
    const [locStatus, setLocStatus] = useState<ComponentStatus>('idle');
    const { useBooleanSetter } = useSetterToolbox();
    const { boolean: isModalOpen, setTrue: openModal, setFalse: closeModal } = useBooleanSetter(false);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [activeModal, setActiveModal] = useState<{ item: any | null, type: 'location' | 'universe' | 'character' | 'note' | ''; }>({ type: '', item: null });
    const currentToolbox = useModalToolbox(activeModal.item, activeModal.type);

    const note_id = currentNote?.note_id;


    const handleCreate = (type: 'location' | 'universe' | 'character' | 'note' | '') => {
        setActiveModal({ type, item: null })
        currentToolbox.reset();
        openModal();
    }

    const handleEdit = (type: 'location' | 'universe' | 'character' | 'note' | '', item: any) => {
        setActiveModal({ type, item })
        openModal();
    }

    const handleDelete = (type: 'location' | 'universe' | 'character' | 'note' | '', item: any) => {
        setActiveModal({ type, item });
        currentToolbox.handleDelete(item);
    }


    const handleCharacterEnter = (e: React.MouseEvent, character: Character) => {
        e.stopPropagation();
        dispatch(setCurrentCharacter(character));
        navigate(`/characters/${character.character_id}`)
    }

    const handleUniverseEnter = (e: React.MouseEvent, universe: Universe) => {
        e.stopPropagation();
        dispatch(setCurrentNote(universe));
        navigate(`/universes/${universe.universe_id}`)
    }

    const handleLocationEnter = (e: React.MouseEvent, location: AppLocation) => {
        e.stopPropagation();
        dispatch(setCurrentLocation(location));
        navigate(`/locations/${location.location_id}`)
    }






    const linkedCharacters = useMemo(() => {
        return currentNote?.characters || [];
    }, [currentNote]);

    const linkedUniverses = useMemo(() => {
        return currentNote?.universes || [];
    }, [currentNote])

    const linkedLocations = useMemo(() => {
        return currentNote?.locations || [];
    }, [currentNote]
    );

    useEffect(() => {
        if (noteLoading) {
            setNoteStatus('loading')
            return;
        }
        if (noteError) {
            setNoteStatus('error')
            return;
        }
        if (!currentNote) {
            setNoteStatus('empty')
            return;
        }
        setNoteStatus('success')
        setCharStatus(currentNote?.characters?.length ? 'success' : 'empty')
        setUniStatus(currentNote?.universes?.length ? 'success' : 'empty')
        setLocStatus(currentNote?.locations?.length ? 'success' : 'empty')

    }, [noteLoading, noteError, currentNote])

    return (

        <main>
            {noteStatus === 'loading' && <Spinner />}
            {noteStatus === 'error' && noteError && <ErrorDisplay
                message={noteError}
                onRetry={() => note_id && dispatch(getNote(note_id))}
            />
            }
            {noteStatus === 'empty' && <EmptyState type={'note'} onAdd={() => handleCreate("note")} />}

            {noteStatus === 'success' && (
                <>
                    <h1>{currentNote?.title}</h1>
                    <EntityManager
                        type="character"
                        isSection={true}
                        data={linkedCharacters}
                        error={noteError}
                        status={charStatus}
                        onDelete={(character) => handleDelete('character', character)}
                        onAdd={() => handleCreate("character")}
                        onEdit={(item: Character) => handleEdit("character", item)}
                        onEnter={() => handleCharacterEnter}
                        onRetry={() => note_id && dispatch(getNote(note_id))}
                        idField="character_id"
                        renderCardContent={(c) => (
                            <>
                                <h3>{c?.name}</h3>
                                <p>Age:{c?.age || 'Unknown'}</p>
                            </>
                        )}
                    />
                    <EntityManager
                        type="universe"
                        isSection={true}
                        data={linkedUniverses}
                        status={uniStatus}
                        error={noteError}
                        onAdd={() => handleCreate("universe")}
                        onEdit={(item: Universe) => handleEdit("universe", item)}
                        onDelete={(universe) => handleDelete('universe', universe)}
                        onEnter={() => handleUniverseEnter}
                        onRetry={() => note_id && dispatch(getNote(note_id))}
                        idField="universe_id"
                        renderCardContent={(u) => (
                            <>
                                <h3>{u?.name}</h3>
                                <p>{u?.description?.substring(30)}</p>
                            </>
                        )}
                    />

                    <EntityManager
                        type="location"
                        isSection={true}
                        data={linkedLocations}
                        status={locStatus}
                        error={noteError}
                        onAdd={() => handleCreate("location")}
                        onEdit={(item: AppLocation) => handleEdit("location", item)}
                        onEnter={() => handleLocationEnter}
                        onDelete={(location) => handleDelete('location', location)}
                        onRetry={() => note_id && dispatch(getNote(note_id))}
                        idField="location_id"
                        renderCardContent={(l) => (
                            <>
                                <h3>{l?.name}</h3>
                                <p>Description: {l?.description || '...'}</p>
                            </>
                        )}
                    />
                    {activeModal.type !== '' && (
                        <GenericModal
                            isOpen={isModalOpen}
                            onClose={closeModal}
                            type={activeModal.type}
                            toolbox={currentToolbox}
                            item={activeModal.item}
                        />
                    )}
                </>
            )}
        </main>
    )

}
