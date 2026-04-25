import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch, useSetterToolbox } from "../../hooks/useSetterToolbox";
import type { Note } from "../../types/note";
import { useModalToolbox } from "../../hooks/useModalToolbox";
import { useState, useEffect } from "react";
import type { ComponentStatus } from "../../types/componentStatus";
import { getAllNotes, setCurrentNote } from "../../features/Note/noteSlice";
import { EntityManager } from "../Universal/EntityManager";
import { GenericModal } from "../Universal/GenericModal";


export const Notes = () => {

    const { allNotes, isLoading, error } = useAppSelector((state) => state.note);
    const { useBooleanSetter } = useSetterToolbox();
    const noteModal = useBooleanSetter(false);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const noteModalInfo = useModalToolbox(selectedNote || {}, 'note');
    const [status, setStatus] = useState<ComponentStatus>('idle');
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        if (isLoading) {
            setStatus('loading');
        } else if (error) {
            setStatus('error')
        } else if (allNotes.length === 0) {
            setStatus('empty')
        } else {
            setStatus('success')
        }
    }, [isLoading, error, allNotes])


    const handleNoteEnter = (e: React.MouseEvent, note: Note) => {
        e.stopPropagation();
        dispatch(setCurrentNote(note));
        navigate(`/notes/${note.note_id}`)
    }

    const noteHandleCreate = () => {
        setSelectedNote(null);
        noteModalInfo.reset();
        noteModal.setTrue();
    }

    const noteHandleEdit = (note: Note) => {
        setSelectedNote(note);
        noteModal.setTrue();
    }


    return (

        <>
            <EntityManager
                type="note"
                data={allNotes}
                status={status}
                error={error}
                onAdd={noteHandleCreate}
                onEdit={noteHandleEdit}
                onEnter={handleNoteEnter}
                onRetry={() => dispatch(getAllNotes())}
                idField="note_id"
                renderCardContent={(n) => (
                    <>
                        <h3>{n.title}</h3>
                        <p>Content:{n.content || '...'}</p>
                    </>
                )}
            />

            <GenericModal
                type="note"
                isOpen={noteModal.boolean}
                onClose={noteModal.setFalse}
                toolbox={noteModalInfo}
                item={selectedNote}
            />
        </>

    )


}