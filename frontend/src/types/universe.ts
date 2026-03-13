export interface Universe {
        universe_id: number | null;
        user_id: number | null;
        name: string | null;
        alignment: AlignmentType | null;
        description: string | null;
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