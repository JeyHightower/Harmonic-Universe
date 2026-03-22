import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useUniversalToolbox';
import { Spinner } from '../Universal/Spinner';
import styles from './Universe.module.css';
import { deleteCharacter} from '../../features/Character/characterSlice';
import type { Character } from '../../types/character';
import { useState } from 'react';
// import { setCurrentLocation } from '../../features/Location/locationSlice';
// import { setCurrentNote } from '../../features/Note/noteSlice';
// import { setCurrentUniverse } from '../../features/Universe/universeSlice';


export const UniverseDetail = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate();
    // const { useModelNavigate } = useUniversalToolbox();
    // const enterModel = useModelNavigate();
    const [error, setError] = useState<string | null>(null);

    const { universe_id } = useParams<{ universe_id: string }>();
    const { currentUniverse, allUniverses, isLoading: uniLoading } = useAppSelector(state => state.universe);
    const universe = (currentUniverse?.universe_id === Number(universe_id)) ? currentUniverse : allUniverses.find((u) => u.universe_id === Number(universe_id));

    
    const { allCharacters, isLoading: charLoading } = useAppSelector(state => state.character);
    const inhabitants = allCharacters.filter((c) => c.universe_id === Number(universe_id));
    const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);

    
    

    const confirmDelete = async () => {
        if (characterToDelete) {
            try {
                setError(null);
                await dispatch(deleteCharacter(characterToDelete.character_id));
                setCharacterToDelete(null);
                console.log('Character has been successfully deleted');
            } catch (error) {
                setError(`${error}, something went wrong please try again.`)


            }
        }
    }

    const handleCloseModal = () => {
        setCharacterToDelete(null);
        setError(null);
    }

    if (uniLoading || charLoading) return <Spinner />;
    if (!universe) return (
        <div>
            <h1>Universe not found.</h1>
            <button onClick={() => navigate('/universes')}>Return to Universes</button>
        </div>)

    return (
        <main className={styles.detailContainer}>
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate('/universes')}>
                    ⬅︎ All Universes
                </button>
                <h1 className={styles.title}>{universe.name}</h1>
                <div className={styles.idBadge}>Frequency: {universe.universe_id}</div>
            </header>

            <hr className={styles.divider} />

            <section className={styles.loreContent}>
                <h3>The Lore</h3>
                <p className={styles.descriptionText}>
                    {universe.description || 'No history has been recoreded for this universe.'}
                </p>
            </section>
            <section className={styles.characterGrid}>
                {inhabitants.length > 0 ? (
                    inhabitants.map((i) => (
                        <div
                            key={i.character_id}
                            className={styles.characterCard}

                        >
                            <h3> {i.name}</h3>
                            <p>Main Power Set: {i.main_power_set}</p>
                            <p>Skills: {i.skills.join(',')}</p>
                            {/* <button className={styles.viewBtn} onClick={() => handleEnterCharacter(i)}>View Inhabitant Details</button> */}
                            <button className={styles.deleteBtn} onClick={() => setCharacterToDelete(i)}>Delete Inhabitant</button>
                        </div>
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>✨</div>
                        <h2>The Great Void</h2>
                        <p>This universe is waiting for its first inhabitant to be born.</p>
                        <button
                            className={styles.createBtn}
                            onClick={() => navigate('/characters/create', { state: { universe_id } })}
                        >
                            Create a Character
                        </button>
                    </div>

                )}
            </section>

            <section>
                <div className={styles.modulePreview}>
                    <h4>Locations</h4>
                    <p>Coming Soon: Explore the unique places of {universe.name}.</p>
                </div>
            </section>

            {characterToDelete && (
                <div className={styles.modalBackdrop} onClick={() => handleCloseModal()}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h2>Delete Character</h2>
                        <p> Are you sure you want to delete <strong>{characterToDelete.name} from this universe?</strong></p>
                        {error && <p className={styles.errorMessage}>⚠️ {error}</p>}

                        <div className={styles.modalActions}>
                            <button onClick={() => handleCloseModal()}>Cancel</button>
                            <button className={styles.deleteBtn} onClick={confirmDelete} disabled={charLoading}>Confirm Delete</button>
                        </div>
                    </div>
                </div>
            )}

        </main>

    )
}
