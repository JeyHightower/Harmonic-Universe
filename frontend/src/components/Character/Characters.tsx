import { useAppDispatch, useAppSelector } from "../../hooks/useSetterToolbox"
import type { ComponentStatus } from "../../types/componentStatus";
import { useState, useEffect } from "react";
import type { Character } from "../../types/character";
import { useModalToolbox } from "../../hooks/useModalToolbox";
import { useNavigate } from "react-router-dom";
import { getAllCharacters, setCurrentCharacter } from "../../features/Character/characterSlice";
import { GenericModal } from "../Universal/GenericModal";
import { EntityManager } from "../Universal/EntityManager";


export const Characters = () => {

    const { allCharacters, isLoading, error } = useAppSelector((state) => state.character);
    const [activeModal, setActiveModal] = useState<{ item: Character | null, type: string }>({ item: null, type: '' });
    const characterModalInfo = useModalToolbox(activeModal.item || {}, 'character');
    const dispatch = useAppDispatch();
    const navigate = useNavigate();


    const status: ComponentStatus = (() => {
        if (isLoading) return 'loading';
        if (error) return 'error';
        if (!allCharacters?.length) return 'empty';
        return 'success';

    })();

    useEffect(() => {
        if(!allCharacters.length){
            dispatch(getAllCharacters())
        }
    }, [dispatch])


    const handleCharacterEnter = (e: React.MouseEvent, character: Character) => {
        e.stopPropagation();
        dispatch(setCurrentCharacter(character));
        navigate(`/characters/${character.character_id}`)
    }

    const characterHandleCreate = () => {
        setActiveModal({ type: 'character', item: null });
        characterModalInfo.reset();

    }

    const characterHandleEdit = (character: Character) => {
        setActiveModal({ type: 'character', item: character });
    }

    const characterHandleDelete = (character: Character) => {
        characterModalInfo.handleDelete(character);
    }

    const handleClose = () => {
        setActiveModal({ type: '', item: null })
    }


    return (
        <>

            <EntityManager
                type="character"
                data={allCharacters}
                status={status}
                error={error}
                onAdd={() => characterHandleCreate()}
                onEdit={(character) => characterHandleEdit(character)}
                onEnter={(e, character) => handleCharacterEnter(e, character)}
                onDelete={(character) => characterHandleDelete(character)}
                onRetry={() => dispatch(getAllCharacters())}
                idField="character_id"
                renderCardContent={(c) => (
                    <>
                        <h3>{c.name}</h3>
                        <p>Age: {c.age || 'Unknown'}</p>
                    </>
                )}
            />
            <GenericModal
                type='character'
                isOpen={activeModal.type === 'character'}
                onClose={handleClose}
                toolbox={characterModalInfo}
                item={activeModal.item}
            />


        </>

    )
};