export interface Note {
    note_id: number;
    title: string;
    content: string | null;
    user_id: number;
    characters: string[];
    universes: string[];
    locations: string[];
}

export type NoteDraft = Omit<Note, 'note_id'>

export interface NoteState {
    currentNote : Note | null;
    allNotes: Note[];
    isLoading: boolean;
    error: string | null;

}