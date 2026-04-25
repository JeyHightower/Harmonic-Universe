import type { AppLocation } from "./location";
import type { Universe } from "./universe";
import type { Character } from "./character";

export interface Note {
    note_id: number;
    title: string;
    content: string | null;
    user_id: number;
    characters: Character[] | null;
    universes: Universe[] | null;
    locations: AppLocation[] | null;
}

export type NoteDraft = Omit<Note, 'note_id'>

export interface NoteState {
    currentNote : Note | null;
    allNotes: Note[];
    isLoading: boolean;
    error: string | null;

}