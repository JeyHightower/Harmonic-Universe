import { useUniversalToolbox } from "../hooks/useUniversalToolbox"
import type { Gallery } from "../types/gallery";
import styles from './Home/Home.module.css';

export const ConnectionGallery = ({ title, items, type }: Gallery) => {
    const { useUniversalNavigation } = useUniversalToolbox();
    const { handleNavigation } = useUniversalNavigation();

    return (
        <section>
            <h2>{title}</h2>
            <div className={styles.galleryGrid}>
                {items.map((item) => {
                    const id = item.id || item.character_id || item.universe_id || item.note_id || item.location_id;
                    return (
                        <div
                            key={id}
                            className={styles.connectionCard}
                            onClick={() => handleNavigation(item, type)}
                        >
                            <strong>{item.name || item.title}</strong>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}