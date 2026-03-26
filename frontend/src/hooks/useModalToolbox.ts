import { useSetterToolbox } from "./useSetterToolbox";
import { useAppDispatch } from "./useSetterToolbox";
import { createCharacter, deleteCharacter, updateCharacter } from "../features/Character/characterActions";
import { createLocation, deleteLocation, updateLocation } from "../features/Location/locationActions";
import { createUniverse, deleteUniverse, updateUniverse } from "../features/Universe/universeActions";
import { createNote, deleteNote, updateNote } from "../features/Note/noteActions";


export const useModalToolbox = <T extends object>(item: T, type: string) => {
    const dispatch = useAppDispatch();

    const { useObjectSetter } = useSetterToolbox();
    const { updateField, reset, object: formData } = useObjectSetter(item || {});

    const actionMap: Record<string, { create: any, update: any, delete: any, idKey: string }> = {
        character: { create: createCharacter, update: updateCharacter, delete: deleteCharacter, idKey: 'character_id' },
        universe: { create: createUniverse, update: updateUniverse, delete: deleteUniverse, idKey: 'universe_id' },
        note: { create: createNote, update: updateNote, delete: deleteNote, idKey: 'note_id' },
        location: { create: createLocation, update: updateLocation, delete: deleteLocation, idKey: 'location_id' }
    } as const;

    const handleSave = async (parentId: string | number) => {
        const modelActions = actionMap[type];
        try {
            if (item) {
                const id = (item as any)[modelActions.idKey];
                await dispatch(modelActions.update({ id, ...formData })).unwrap();
            }
            else {
                const payload = type === 'universe' ? formData : { ...formData, universe_id: parentId }
                await dispatch(modelActions.create(payload)).unwrap();
            }
            reset();

        } catch (error) {
            console.error(`Failed to save ${type}:`, error);
        }

    }

    const handleDelete = async () => {
        if (!item) return;
        const modelActions = actionMap[type];
        const id = (item as any)[modelActions.idKey];
        if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
            await dispatch(modelActions.delete(id)).unwrap();
        }
    }
    return { formData, handleSave, reset, updateField, handleDelete }
};




