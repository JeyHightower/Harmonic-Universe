import  { useMemo } from "react";
import { FORM_CONFIG } from "../helpers";
import  { useAppSelector } from "./useSetterToolbox";



export const useHydratedFields = (type: 'universe' | 'character' | 'note' | 'location') => {
    const { allUniverses } = useAppSelector(state => state.universe);
    const { allCharacters } = useAppSelector(state => state.character);
    const { allNotes } = useAppSelector(state => state.note);
    const { allLocations } = useAppSelector(state => state.location);

    const universeOptions = useMemo(() =>
        allUniverses?.map((u) => ({ value: u.universe_id, label: u.name })),
    [allUniverses]);

    const characterOptions = useMemo(() =>
        allCharacters?.map((c) => ({ value: c.character_id, label: c.name })),
    [allCharacters]);

    const noteOptions = useMemo(() =>
        allNotes?.map((n) => ({ value: n.note_id, label: n.title })),
    [allNotes]);

    const locationOptions = useMemo(() =>
        allLocations?.map((l) => ({ value: l.location_id, label: l.name })),
    [allLocations]);

    const hydratedFields = useMemo(() => {
        const fields = (FORM_CONFIG as any)[type];
        if (!fields) return [];
        return fields.map((field: any) => {
            if (field.name === 'universe_id') return { ...field, options: universeOptions };
            if (field.name === 'character_id') return { ...field, options: characterOptions };
            if (field.name === 'note_id') return { ...field, options: noteOptions };
            if (field.name === 'location_id') return { ...field, options: locationOptions };
            return field;
        });
    }, [type, universeOptions, characterOptions, noteOptions, locationOptions]);

    return hydratedFields;
};