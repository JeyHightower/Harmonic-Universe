import { useNavigationToolbox } from "../../hooks/useNavigationToolbox"
import type { Gallery } from "../../types/gallery";
import { EmptyState } from "./EmptyState";
import { useMemo, useState } from "react";
import { useModalToolbox } from "../../hooks/useModalToolbox";
import { GenericModal } from "./GenericModal";
import { useAppSelector } from "../../hooks/useSetterToolbox";
import { FORM_CONFIG } from "../../helpers";

export const ConnectionGallery = ({ title, items, type }: Gallery) => {

    const { handleModelAction } = useNavigationToolbox();
    const { allUniverses } = useAppSelector(state => state.universe);
    const [activeModal, setActiveModal] = useState<{ item: any, type: string }>({ item: null, type: '' })
    const modalInfo = useModalToolbox(activeModal.item || {}, type)


    const universeOptions = useMemo(() => {
       return allUniverses?.map((u) => ({
            value: u?.universe_id,
            label: u?.name
        }))
    }, [allUniverses])

    const hydratedFields = useMemo(() => {
        const fields = (FORM_CONFIG as any)[type];
        if(!fields) return [];
        return fields.map((field:any) => {
            if(field.name === 'universe_id'){
                return { ... field, options: universeOptions};
            }
            return field;
        })
    }, [type, universeOptions]);

    const handleCreate = () => {
        modalInfo.reset();
        setActiveModal({ type: type, item: null });
    }

    const handleClose = () => {
        setActiveModal({ type: '', item: null })
    }

    return (
        <section>
            <h2>{title}</h2>
            <div className="galleryGrid">
                {items.length > 0 ? (
                    items.map((item) => {
                        const id = item.id || item.character_id || item.universe_id || item.note_id || item.location_id;
                        const label = item.name || item.title;
                        return (
                            <div
                                key={`${type}-${id}`}
                                className="connectionCard"
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
                fields={hydratedFields}
            />

        </section>
    )
}


