import { useAppDispatch, useAppSelector, useSetterToolbox } from "../../hooks/useSetterToolbox"
import type { ComponentStatus } from "../../types/componentStatus";
import { useState, useEffect } from "react";
import type { Universe } from "../../types/universe";
import { useModalToolbox } from "../../hooks/useModalToolbox";
import { useSetterToolbox } from "../../hooks/useSetterToolbox";
import type { Character } from "../../types/character";
import { useNavigate } from "react-router-dom";
import { setCurrentCharacter } from "../../features/Character/characterSlice";
import type { Note } from "../../types/note";
import { setCurrentNote } from "../../features/Note/noteSlice";
import { setCurrentLocation } from "../../features/Location/locationSlice";
import type { AppLocation } from "../../types/location";
import { getAllCharacters } from "../../features/Character/characterSlice";
import { EntityManager } from "../Universal/EntityManager";


export const UniverseDetail = () => {
    const { currentUniverse , error:uniError, isLoading:uniLoading } = useAppSelector((state) => state.universe);
    const { allCharacters, isLoading:charLoading, error:charError } = useAppSelector((state) => state.character);
    const { allNotes, isLoading:noteLoading, error:noteError } = useAppSelector((state) => state.note);
    const { allLocations, isLoading:locLoading, error:locError }= useAppSelector((state) => state.location);
    const [uniStatus, setUniStatus] = useState<ComponentStatus>('idle');
    const [charStatus, setCharStatus] = useState<ComponentStatus>('idle');
    const [noteStatus, setNoteStatus] = useState<ComponentStatus>('idle');
    const [locStatus, setLocStatus] = useState<ComponentStatus>('idle');
    const { useBooleanSetter } = useSetterToolbox();
    const { boolean:isModalOpen,setTrue:openModal, setFalse: closeModal } = useBooleanSetter(false);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();


    const [activeModal, setActiveModal] = useState<{item:any| null, type:string}>({type:'', item:null}); 
    const currentToolbox = useModalToolbox(activeModal.item, activeModal.type);
    

    const handleCreate = (type:string) => {
            setActiveModal({type, item:null})
            currentToolbox.reset();
            openModal();
    }

    const handleEdit = (type:string, item:any) => {
        setActiveModal({type, item})
        openModal();
    }

    const handleCharacterEnter = (e:React.MouseEvent, character:Character) => {
        e.stopPropagation();
        dispatch(setCurrentCharacter(character));
        navigate(`/characters/${character.character_id}`)
    }

    const handleNoteEnter = (e:React.MouseEvent, note:Note) => {
        e.stopPropagation();
        dispatch(setCurrentNote(note));
        navigate(`/notes/${note.note_id}`)
    }

    const handleLocationEnter = (e:React.MouseEvent, location:AppLocation) => {
        e.stopPropagation();
        dispatch(setCurrentLocation(location));
        navigate(`/locations/${location.location_id}`)
    }



    const linkedCharacters = allCharacters.filter((c) => 
        c.universes?.some((u) => u.universe_id === currentUniverse?.universe_id)
    );

    const linkedNotes = allNotes.filter((n) => 
        n.universes?.some((u) => u.universe_id === currentUniverse?. universe_id)
    );

    const linkedLocations = allLocations.filter((l) => l.universe_id === currentUniverse?.universe_id);
   


    useEffect(() => {
        if(uniLoading){
            setUniStatus('loading')
        } else if(uniError){
            setUniStatus('error')
        } else if(!currentUniverse){
            setUniStatus('empty')
        } else {
            setUniStatus('success')
        }
    }, [uniLoading, uniError, currentUniverse])


    useEffect(() => {
        if(!currentUniverse) return;

        if(charLoading){
            setCharStatus('loading')
        } else if(charError){
            setCharStatus('error')
        } else if(linkedCharacters.length === 0){
            setCharStatus('empty')
        } else {
            setCharStatus('success')
        }
    }, [charLoading, charError, linkedCharacters, currentUniverse])

    useEffect(() => {
        if(!currentUniverse) return;

        if(noteLoading){
            setNoteStatus('loading')
        } else if(noteError){
            setNoteStatus('error')
        } else if(linkedNotes.length === 0){
            setNoteStatus('empty')
        } else {
            setNoteStatus('success')
        }
    }, [currentUniverse, noteLoading, noteError, linkedNotes])

    useEffect(() => {
        if(!currentUniverse) return;

        if (locLoading){
            setLocStatus('loading')
        } else if(locError){
            setLocStatus('error')
        } else if(linkedLocations.length === 0){
            setLocStatus('empty')
        } else {
            setLocStatus('success')
        }
    }, [currentUniverse, locLoading, locError, linkedLocations])






    return (
        
        <main>
            <h1>{currentUniverse?.name}</h1>
            <EntityManager
                type="character"
                isSection={true}
                data={linkedCharacters}
                status={charStatus}
                onAdd={() => handleCreate('character')}
                onEdit={(item:Character) => handleEdit('character', item)}
                onEnter={handleCharacterEnter}
                onRetry={() => dispatch(getAllCharacters())}
                idField="character_id"
                renderCardContent={}
                />

        </main>

    )



}
















//! ------- Old code below -------


// import { useNavigate, useParams } from 'react-router-dom';
// import { useAppDispatch, useAppSelector } from '../../hooks/useSetterToolbox';
// import { Spinner } from '../Universal/Spinner';
// import styles from './Universe.module.css';
// import { deleteCharacter} from '../../features/Character/characterSlice';
// import type { Character } from '../../types/character';
// import { useState } from 'react';
// import { setCurrentLocation } from '../../features/Location/locationSlice';
// import { setCurrentNote } from '../../features/Note/noteSlice';
// import { setCurrentUniverse } from '../../features/Universe/universeSlice';


// export const UniverseDetail = () => {
//     const dispatch = useAppDispatch()
//     const navigate = useNavigate();
//     const { useModelNavigate } = useSetterToolbox();
//     const enterModel = useModelNavigate();
//     const [error, setError] = useState<string | null>(null);

//     const { universe_id } = useParams<{ universe_id: string }>();
//     const { currentUniverse, allUniverses, isLoading: uniLoading } = useAppSelector(state => state.universe);
//     const universe = (currentUniverse?.universe_id === Number(universe_id)) ? currentUniverse : allUniverses.find((u) => u.universe_id === Number(universe_id));

    
//     const { allCharacters, isLoading: charLoading } = useAppSelector(state => state.character);
//     const inhabitants = allCharacters.filter((c) => c.universe_id === Number(universe_id));
//     const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);

    
    

//     const confirmDelete = async () => {
//         if (characterToDelete) {
//             try {
//                 setError(null);
//                 await dispatch(deleteCharacter(characterToDelete.character_id));
//                 setCharacterToDelete(null);
//                 console.log('Character has been successfully deleted');
//             } catch (error) {
//                 setError(`${error}, something went wrong please try again.`)


//             }
//         }
//     }

//     const handleCloseModal = () => {
//         setCharacterToDelete(null);
//         setError(null);
//     }

//     if (uniLoading || charLoading) return <Spinner />;
//     if (!universe) return (
//         <div>
//             <h1>Universe not found.</h1>
//             <button onClick={() => navigate('/universes')}>Return to Universes</button>
//         </div>)

//     return (
//         <main className={styles.detailContainer}>
//             <header className={styles.header}>
//                 <button className={styles.backBtn} onClick={() => navigate('/universes')}>
//                     ⬅︎ All Universes
//                 </button>
//                 <h1 className={styles.title}>{universe.name}</h1>
//                 <div className={styles.idBadge}>Frequency: {universe.universe_id}</div>
//             </header>

//             <hr className={styles.divider} />

//             <section className={styles.loreContent}>
//                 <h3>The Lore</h3>
//                 <p className={styles.descriptionText}>
//                     {universe.description || 'No history has been recoreded for this universe.'}
//                 </p>
//             </section>
//             <section className={styles.characterGrid}>
//                 {inhabitants.length > 0 ? (
//                     inhabitants.map((i) => (
//                         <div
//                             key={i.character_id}
//                             className={styles.characterCard}

//                         >
//                             <h3> {i.name}</h3>
//                             <p>Main Power Set: {i.main_power_set}</p>
//                             <p>Skills: {i.skills.join(',')}</p>
//                             {/* <button className={styles.viewBtn} onClick={() => handleEnterCharacter(i)}>View Inhabitant Details</button> */}
//                             <button className={styles.deleteBtn} onClick={() => setCharacterToDelete(i)}>Delete Inhabitant</button>
//                         </div>
//                     ))
//                 ) : (
//                     <div className={styles.emptyState}>
//                         <div className={styles.emptyIcon}>✨</div>
//                         <h2>The Great Void</h2>
//                         <p>This universe is waiting for its first inhabitant to be born.</p>
//                         <button
//                             className={styles.createBtn}
//                             onClick={() => navigate('/characters/create', { state: { universe_id } })}
//                         >
//                             Create a Character
//                         </button>
//                     </div>

//                 )}
//             </section>

//             <section>
//                 <div className={styles.modulePreview}>
//                     <h4>Locations</h4>
//                     <p>Coming Soon: Explore the unique places of {universe.name}.</p>
//                 </div>
//             </section>

//             {characterToDelete && (
//                 <div className={styles.modalBackdrop} onClick={() => handleCloseModal()}>
//                     <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
//                         <h2>Delete Character</h2>
//                         <p> Are you sure you want to delete <strong>{characterToDelete.name} from this universe?</strong></p>
//                         {error && <p className={styles.errorMessage}>⚠️ {error}</p>}

//                         <div className={styles.modalActions}>
//                             <button onClick={() => handleCloseModal()}>Cancel</button>
//                             <button className={styles.deleteBtn} onClick={confirmDelete} disabled={charLoading}>Confirm Delete</button>
//                         </div>
//                     </div>
//                 </div>
//             )}

//         </main>

//     )
// }
