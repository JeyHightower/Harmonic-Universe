export interface Note {
    noteId: number;
    title: string;
    content: string | null;
    userId: number;
    characters: string[];
    universes: string[];
    locations: string[];
}

export type NoteDraft = Omit<Note, 'noteId'>

export interface NoteState {
    currentNote : Note | null;
    allNotes: Note[];
    isLoading: boolean;
    error: string | null;

}