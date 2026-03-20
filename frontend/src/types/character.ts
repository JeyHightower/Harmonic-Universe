export interface Character {
    character_id: number;
    universe_id: number;
    user_id: number;
    name: string;
    age: number | null;
    origin: string | null;
    main_power_set: string;
    secondary_power_set: string;
    skills: string[];
    universes: string[] | null;
    notes: string[] | null;
    locations: string[] | null;

}

export type CharacterDraft = Omit<Character, 'character_id'>;

export interface CharacterState {
    currentCharacter: Character | null;
    allCharacters: Character[];
    isLoading:boolean;
    error: string | null;
}