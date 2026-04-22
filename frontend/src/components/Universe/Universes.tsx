import { useAppSelector, useSetterToolbox } from '../../hooks/useSetterToolbox';
import type { Universe } from '../../types/universe';
import { Spinner } from '../Universal/Spinner';
import { useState } from 'react';
import styles from './Universe.module.css';
import { useModalToolbox } from '../../hooks/useModalToolbox';
import { GenericModal } from '../GenericModal';

export const Universes = () => {
    const { allUniverses, isLoading } = useAppSelector((state) => state.universe);
    const [selectedUniverse, setSelectedUniverse] = useState<Universe | null>(null);
    const { useBooleanSetter } = useSetterToolbox();
    const universeModal = useBooleanSetter(false);
    const universeModalInfo = useModalToolbox(selectedUniverse || {}, 'universe');

    const handleCreate = () => {
        setSelectedUniverse(null);
        universeModalInfo.reset();
        universeModal.setTrue();

    }

    const handleEdit = (universe: Universe) => {
        setSelectedUniverse(universe);
        universeModal.setTrue();
    }


    if (isLoading) return <Spinner />;


    return (
        <main className={styles.pageContainer}>
            <header>
                <h1> Your Universes</h1>
                <button onClick={handleCreate}>+ CREATE UNIVERSE</button>
            </header>

            <section className={styles.grid}>
                {allUniverses.map((u) => (
                    <div
                        key={u.universe_id}
                        className={styles.universeCard}
                        onClick={() => handleEdit(u)}
                    >
                        <h3>{u.name}</h3>
                        <p>{u.description?.substring(0, 100)}...</p>
                        <button className={styles.viewBtn}>Enter Universe</button>
                    </div>
                ))}
            </section>
            <GenericModal
                type="universe"
                isOpen={universeModal.boolean}
                onClose={universeModal.setFalse}
                toolbox={universeModalInfo}
                item={selectedUniverse}
            />


        </main>

    );

};