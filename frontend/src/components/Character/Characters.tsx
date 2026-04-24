import { useAppDispatch, useAppSelector, useSetterToolbox } from "../../hooks/useSetterToolbox"
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
    const { useBooleanSetter } = useSetterToolbox();
    const characterModal = useBooleanSetter(false);
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
    const [status, setStatus] = useState<ComponentStatus>('idle');
    const characterModalInfo = useModalToolbox(selectedCharacter || {}, 'character');
    const dispatch = useAppDispatch();
    const navigate = useNavigate();


    useEffect(() => {
        if (isLoading) {
            setStatus('loading')
        } else if (error) {
            setStatus('error')
        } else if (allCharacters.length === 0) {
            setStatus('empty')
        } else {
            setStatus('success')
        }
    }, [isLoading, error, allCharacters])

    const handleCharacterEnter = (e: React.MouseEvent, character: Character) => {
        e.stopPropagation();
        dispatch(setCurrentCharacter(character));
        navigate(`/characters/${character.character_id}`)
    }

    const characterHandleCreate = () => {
        setSelectedCharacter(null);
        characterModalInfo.reset();
        characterModal.setTrue();
    }

    const characterHandleEdit = (character: Character) => {
        setSelectedCharacter(character);
        characterModal.setTrue();
    }


    return (
        <>

            <EntityManager
                type="character"
                data={allCharacters}
                status={status}
                error={error}
                onAdd={characterHandleCreate}
                onEdit={characterHandleEdit}
                onEnter={handleCharacterEnter}
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
                isOpen={characterModal.boolean}
                onClose={characterModal.setFalse}
                toolbox={characterModalInfo}
                item={selectedCharacter}
            />


        </>

    )
};