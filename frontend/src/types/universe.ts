import type { Character } from "./character";
import type { AppLocation } from "./location";
import type { Note } from "./note";

export interface Universe {
        universe_id: number | null;
        user_id: number | null;
        name: string | null;
        alignment: Alignment | null;
        description: string | null;
        characters: Character[] | null;
        locations: AppLocation[] | null;
        notes: Note[] | null;
};

export interface UniverseResponse {
    Message:string;
    Universe:Universe;
}

export interface UniverseState {
    currentUniverse: Universe | null;
    allUniverses: Universe[];
    isLoading: boolean;
    error: string | null;
}
    

export type UniverseDraft = Omit<Universe, 'universe_id'>;

export const AlignmentType = {
    GOOD : 'good',
    BAD : 'bad',
    NEUTRAL : 'neutral',
    CHAOTIC  : 'chaotic',
    LAWFUL : 'lawful'
} as const ;


export type Alignment = typeof AlignmentType[keyof typeof AlignmentType];