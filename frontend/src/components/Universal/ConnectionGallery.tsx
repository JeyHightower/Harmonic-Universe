import { useNavigationToolbox } from "../../hooks/useNavigationToolbox"
import type { Gallery } from "../../types/gallery";
import styles from '../Home/Home.module.css';
import { EmptyState } from "./EmptyState";
import { useState } from "react";
import { useModalToolbox } from "../../hooks/useModalToolbox";
import { GenericModal } from "./GenericModal";

export const ConnectionGallery = ({ title, items, type }: Gallery) => {

    const { handleModelAction } = useNavigationToolbox();
    const [activeModal, setActiveModal] = useState<{ item: any, type: string }>({ item: null, type: '' })
    const modalInfo = useModalToolbox(activeModal.item || {}, type)

    const handleCreate = () => {
        modalInfo.reset()
        setActiveModal({ type: type, item: null })
    }

    const handleClose = () => {
        setActiveModal({ type: '', item: null })
    }

    return (
        <section>
            <h2>{title}</h2>
            <div className={styles.galleryGrid}>
                {items.length > 0 ? (
                    items.map((item) => {
                        const id = item.id || item.character_id || item.universe_id || item.note_id || item.location_id;
                        const label = item.name || item.title;
                        return (
                            <div
                                key={`${type}-${id}`}
                                className={styles.connectionCard}
                                onClick={() => handleModelAction(item, type)}
                            >
                                <strong>{label}</strong>
                            </div>
                        )
                    })) : (
                    <EmptyState type={type} onAdd={handleCreate} />
                )}
            </div>
            <GenericModal
                type={type}
                isOpen={activeModal.type === type}
                onClose={handleClose}
                toolbox={modalInfo}
                item={activeModal.item}
            />

        </section>
    )
}


