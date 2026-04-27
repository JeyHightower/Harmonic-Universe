import { useNavigate } from "react-router-dom";
import { useModalToolbox } from "../../hooks/useModalToolbox";
import { useAppDispatch, useAppSelector, useSetterToolbox } from "../../hooks/useSetterToolbox"
import type { ComponentStatus } from "../../types/componentStatus";
import { useState, useEffect, useMemo } from "react";
import type { Character } from "../../types/character";
import { setCurrentCharacter } from "../../features/Character/characterSlice";
import type { Note } from "../../types/note";
import { setCurrentNote } from "../../features/Note/noteSlice";
import { Spinner } from "../Universal/Spinner";
import { ErrorDisplay } from "../Universal/ErrorDisplay";
import { getLocation } from "../../features/Location/locationActions";
import { EmptyState } from "../Universal/EmptyState";
import { EntityManager } from "../Universal/EntityManager";
import { GenericModal } from "../Universal/GenericModal";


export const LocationDetail = () => {
    const { currentLocation, error: locError, isLoading: locLoading } = useAppSelector((state) => state.location);
    const [locStatus, setLocStatus] = useState<ComponentStatus>('idle');
    const [charStatus, setCharStatus] = useState<ComponentStatus>('idle');
    const [noteStatus, setNoteStatus] = useState<ComponentStatus>('idle');
    const { useBooleanSetter } = useSetterToolbox();
    const { boolean: isModalOpen, setTrue: openModal, setFalse: closeModal } = useBooleanSetter(false)
    const [activeModal, setActiveModal] = useState<{ item: any | null, type: string }>({ item: null, type: '' })
    const currentToolbox = useModalToolbox(activeModal.item, activeModal.type);
    const location_id = currentLocation?.location_id;
    const dispatch = useAppDispatch();
    const navigate = useNavigate();


    const handleCreate = (type: string) => {
        setActiveModal({ item: null, type });
        currentToolbox.reset();
        openModal();
    }

    const handleEdit = (item: any, type: string) => {
        setActiveModal({ item, type });
        openModal();
    }


    const handleCharacterEnter = (e: React.MouseEvent, character: Character) => {
        e.stopPropagation();
        dispatch(setCurrentCharacter(character));
        navigate(`/characters/${character.character_id}`);
    }

    const handleNoteEnter = (e: React.MouseEvent, note: Note) => {
        e.stopPropagation();
        dispatch(setCurrentNote(note));
        navigate(`/notes/${note.note_id}`);
    }



    const linkedNotes = useMemo(() => {
        return currentLocation?.notes || [];
    }, [currentLocation])

    const linkedCharacters = useMemo(() => {
        return currentLocation?.characters || [];
    }, [currentLocation])


    useEffect(() => {
        if (locLoading) {
            setLocStatus('loading')
            return;
        }

        if (locError) {
            setLocStatus('error')
            return;
        }

        if (!currentLocation)
            setLocStatus('empty')
        return;

        setLocStatus('success')
        setCharStatus(currentLocation?.characters?.length ? 'success' : 'empty')
        setNoteStatus(currentLocation?.notes?.length ? 'success' : 'empty');
    }, [locLoading, locError, currentLocation])


    return (

        <main>
            {locStatus === 'loading' && <Spinner />}
            {locStatus === 'error' && locError && <ErrorDisplay message={locError} onRetry={() => location_id && dispatch(getLocation(location_id))} />}
            {locStatus === 'empty' && <EmptyState type={'location'} onAdd={() => handleCreate('location')} />}
            {locStatus === 'success' && (
                <>
                    <h1>{currentLocation?.name}</h1>
                    <p>{currentLocation?.description || 'Description Needed!!'}</p>
                    <EntityManager
                        type="character"
                        isSection={true}
                        data={linkedCharacters}
                        error={locError}
                        status={charStatus}
                        onAdd={() => handleCreate('character')}
                        onEdit={(item: Character) => handleEdit(item, 'character')}
                        onEnter={handleCharacterEnter}
                        onRetry={() => location_id && dispatch(getLocation(location_id))}
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
                        error={locError}
                        onAdd={() => handleCreate("note")}
                        onEdit={(item: Note) => handleEdit(item, "note")}
                        onEnter={handleNoteEnter}
                        onRetry={() => location_id && dispatch(getLocation(location_id))}
                        idField="note_id"
                        renderCardContent={(n) => (
                            <>
                                <h3>{n.title}</h3>
                                <p>Content:{n.content || '...'}</p>
                            </>
                        )}
                    />

                </>

            )}
            <GenericModal
                isOpen={isModalOpen}
                onClose={closeModal}
                type={activeModal.type}
                toolbox={currentToolbox}
                item={activeModal.item}
            />

        </main>


    )
}