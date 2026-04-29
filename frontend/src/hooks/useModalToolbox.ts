import { useSetterToolbox } from "./useSetterToolbox";
import { useAppDispatch } from "./useSetterToolbox";
import { createCharacter, deleteCharacter, updateCharacter } from "../features/Character/characterActions";
import { createLocation, deleteLocation, updateLocation } from "../features/Location/locationActions";
import { createUniverse, deleteUniverse, updateUniverse } from "../features/Universe/universeActions";
import { createNote, deleteNote, updateNote } from "../features/Note/noteActions";


export const useModalToolbox = <T extends object>(item: T | null, type: string) => {
    const dispatch = useAppDispatch();


    const { useObjectSetter } = useSetterToolbox();
    const { updateField, reset, object: formData } = useObjectSetter(item || null );

    const actionMap: Record<string, { create: any, update: any, delete: any, idKey: string }> = {
        character: { create: createCharacter, update: updateCharacter, delete: deleteCharacter, idKey: 'character_id' },
        universe: { create: createUniverse, update: updateUniverse, delete: deleteUniverse, idKey: 'universe_id' },
        note: { create: createNote, update: updateNote, delete: deleteNote, idKey: 'note_id' },
        location: { create: createLocation, update: updateLocation, delete: deleteLocation, idKey: 'location_id' }
    } as const;

    const handleSave = async (extraData: Record<string, any> = {}) => {

        const modelActions = actionMap[type];
        
        if(!modelActions) return;
        try {
            const id = item ? (item as any)[modelActions.idKey] : null;
            if (id) {
                if(!id) throw new Error("Missing ID for Update");
                await dispatch(modelActions.update({ 
                    [modelActions.idKey]: id,
                    [`${type}Data`]:formData })).unwrap();
            }
            else {
                const payload = { ...formData, ...extraData }
                await dispatch(modelActions.create(payload)).unwrap();
            }

            reset();
            return {success:true};

        } catch (error) {
            console.error(`Failed to save ${type}:`, error);
            return {success: false, error}
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




