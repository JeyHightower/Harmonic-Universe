import type { Character } from "./character";
import type { AppLocation } from "./location";
import type { Note } from "./note";

export interface Universe {
        universe_id: number | null;
        user_id: number | null;
        name: string | null;
        alignment: AlignmentType | null;
        description: string | null;
        characters: Character[] | null;
        locations: AppLocation[] | null;
        notes: Note[] | null;
};


export interface UniverseState {
    currentUniverse: Universe | null;
    allUniverses: Universe[];
    isLoading: boolean;
    error: string | null;
}
    

export type UniverseDraft = Omit<Universe, 'universe_id'>;

export enum AlignmentType {
    GOOD = 'good',
    BAD = 'bad',
    NEUTRAL = 'neutral',
    CHAOTIC  = 'chaotic',
    LAWFUL = 'lawful'
}