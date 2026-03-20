import { useUniversalToolbox } from '../../hooks/useUniversalToolbox';
import styles from './Home.module.css';
import hoverSound from '../../assets/mixkit-sci-fi-confirmation-914.wav';
import { useNavigate } from 'react-router-dom';


export const Home = () => {
    const navigate = useNavigate();
    const { useAudioTrigger } = useUniversalToolbox();
    const { play: playHover } = useAudioTrigger(hoverSound);

    const NAV_MODULES = [
        { 
            id: 'universes', 
            title: 'Universes', 
            description: 'The celestial canvas. Define the laws, eras, and physics of your unique reality.',
            icon: '🌌',
            isAvailable: true 
        },
        { 
            id: 'characters', 
            title: 'Characters', 
            description: 'The heartbeat of the story. Track backstories, traits, and complex relationships.',
            icon: '👤',
            isAvailable: true 
        },
        { 
            id: 'locations', 
            title: 'Locations', 
            description: 'From sprawling galaxies to intimate taverns. Map out every coordinate.',
            icon: '📍',
            isAvailable: true 
        },
        { 
            id: 'notes', 
            title: 'Lore Notes', 
            description: 'The written history. Document magic systems, myths, and plot threads.',
            icon: '📜',
            isAvailable: true 
        },
        { 
            id: 'music', 
            title: 'Harmonic Sync', 
            description: 'The ultimate immersion. Generate AI-driven soundtracks for your worlds.',
            icon: '🎵',
            isAvailable: false
        }
    ];

    return (

        <main className={styles.homeContainer}>
            <header className={styles.hero}>
                <h1 className={styles.logoText}>Harmonic Universe</h1>
                <p>Where the symphony of creation begins.</p>
            </header>

            <section className={styles.grid}>
                {NAV_MODULES.map((module) => (
                    <div
                        key={module.id}
                        className={`${styles.card} ${!module.isAvailable ? styles.comingSoon : ''}`}
                        onMouseEnter={() => module.isAvailable && playHover()}
                    >
                        <div className={styles.icon}>{module.icon}</div>
                        <h3>{module.title}</h3>
                        <p>{module.description}</p>

                        {module.isAvailable ? (
                            <button
                                className={styles.enterBtn}
                                onClick={() => navigate(`/${module.id}`)}>
                                    Open {module.title}
                                    </button>
                        ) : (
                            <div className={styles.badge}>Coming Soon</div>
                        )}

                    </div>    
                ))}
            </section>

        </main>

    );
};
