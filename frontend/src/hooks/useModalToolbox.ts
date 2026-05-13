import { useSetterToolbox } from "./useSetterToolbox";
import { useAppDispatch } from "./useSetterToolbox";
import { createCharacter, deleteCharacter, getAllCharacters, updateCharacter } from "../features/Character/characterActions";
import { createLocation, deleteLocation, getAllLocations, updateLocation } from "../features/Location/locationActions";
import { createUniverse, deleteUniverse, getAllUniverses, updateUniverse } from "../features/Universe/universeActions";
import { createNote, deleteNote, getAllNotes, updateNote } from "../features/Note/noteActions";


export const useModalToolbox = <T extends object>(item: T | null, type: string) => {
    const dispatch = useAppDispatch();


    const { useObjectSetter } = useSetterToolbox();
    const { updateField, reset, addFields, object: formData } = useObjectSetter(item || null);

    const actionMap: Record<string, { create: any, update: any, delete: any, idKey: string, refetch: any }> = {
        character: { create: createCharacter, update: updateCharacter, delete: deleteCharacter, idKey: 'character_id', refetch: getAllCharacters },
        universe: { create: createUniverse, update: updateUniverse, delete: deleteUniverse, idKey: 'universe_id', refetch: getAllUniverses },
        note: { create: createNote, update: updateNote, delete: deleteNote, idKey: 'note_id', refetch: getAllNotes },
        location: { create: createLocation, update: updateLocation, delete: deleteLocation, idKey: 'location_id', refetch: getAllLocations }
    } as const;

    const handleSave = async (extraData: Record<string, any> = {}) => {

        const modelActions = actionMap[type];

        if (!modelActions) return;


        try {
            const id = item ? (item as any)[modelActions.idKey] : null;
            if (id) {
                await dispatch(modelActions.update({
                    [modelActions.idKey]: id,
                    [`${type}Data`]: formData
                })).unwrap();
            }
            else {
                const payload = { ...formData, ...extraData };
                await dispatch(modelActions.create(payload)).unwrap();
            }

            reset();
            return { success: true };

        } catch (error) {
            console.error(`Failed to save ${type}:`, error);
            return { success: false, error }
        }

    }

    const handleDelete = async (overrideItem?: T) => {
        const target = overrideItem || item;
        if (!target) return;
        const modelActions = actionMap[type];
        const id = (target as any)[modelActions.idKey];
        if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
            try {

                await dispatch(modelActions.delete(id)).unwrap();
                await dispatch(modelActions.refetch()).unwrap();
            } catch (error) {
                console.error(`Failed to delete ${type}:`, error);
            }
        }
    }
    return { formData, handleSave, reset, updateField, addFields, handleDelete }
};




