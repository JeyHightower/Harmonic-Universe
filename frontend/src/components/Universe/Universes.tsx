import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useUniversalToolbox';
import { setCurrentUniverse } from '../../features/Universe/universeSlice';
import type { Universe } from '../../types/universe';
import { Spinner } from '../Universal/Spinner';
import styles from './Universe.module.css';

export const Universes = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const  {allUniverses, isLoading } = useAppSelector((state) => state.universe);

    const handleEnterUniverse = (universe:Universe) => {
        dispatch(setCurrentUniverse(universe));
        navigate(`/universes/${universe.universe_id}`);
    };

  
    if (isLoading) return <Spinner />;


    return (
        <main className = {styles.pageContainer}>
            <header>
                <h1> Your Universes</h1>
                <button onClick={() => navigate('/create-universe')}>+ CREATE UNIVERSE</button>
            </header>

            <section className={styles.grid}>
                {allUniverses.map((u) => (
                    <div
                        key={u.universe_id}
                        className={styles.universeCard}
                        onClick={() => handleEnterUniverse(u)}
                        >
                            <h3>{u.name}</h3>
                            <p>{u.description?.substring(0,100)}...</p>
                            <button className={styles.viewBtn}>Enter Universe</button>
                        </div>
                ))}
            </section>
            

        </main>

    );

};