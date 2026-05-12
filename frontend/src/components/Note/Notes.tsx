import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch} from "../../hooks/useSetterToolbox";
import type { Note } from "../../types/note";
import { useModalToolbox } from "../../hooks/useModalToolbox";
import { useState, useEffect } from "react";
import type { ComponentStatus } from "../../types/componentStatus";
import { getAllNotes, setCurrentNote } from "../../features/Note/noteSlice";
import { EntityManager } from "../Universal/EntityManager";
import { GenericModal } from "../Universal/GenericModal";


export const Notes = () => {

    const { allNotes, isLoading, error } = useAppSelector((state) => state.note);
    const [activeModal, setActiveModal] = useState<{item:Note | null, type:string}>({item:null, type:''})
    const noteModalInfo = useModalToolbox(activeModal.item || {}, 'note');
    const [status, setStatus] = useState<ComponentStatus>('idle');
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        if (isLoading) {
            setStatus('loading');
            return;
        }
        if (error) {
            setStatus('error')
            return;
        }
        if (allNotes.length === 0) {
            setStatus('empty')
            return;
        }
        setStatus('success')

    }, [isLoading, error, allNotes])


    const handleNoteEnter = (e: React.MouseEvent, note: Note) => {
        e.stopPropagation();
        dispatch(setCurrentNote(note));
        navigate(`/notes/${note.note_id}`)
    }


    const noteHandleCreate = () => {
        setActiveModal({item:null, type:'note'});
        noteModalInfo.reset();
        
    }


    const noteHandleEdit = (note: Note) => {
        setActiveModal({item:note, type:'note'});
    }

    const handleClose = () => {
        setActiveModal({item:null, type:''})
    }

    const handleNoteDelete = (note:Note) => {
        noteModalInfo.handleDelete(note);
    }


    return (

        <>
            <EntityManager
                type="note"
                data={allNotes}
                status={status}
                error={error}
                onDelete={(note) => handleNoteDelete(note)}
                onAdd={() => noteHandleCreate()}
                onEdit={(note) => noteHandleEdit(note)}
                onEnter={(e, note) => handleNoteEnter(e,note)}
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
                isOpen={activeModal.type === 'note' }
                onClose={handleClose}
                toolbox={noteModalInfo}
                item={activeModal.item}
            />
        </>

    )


}