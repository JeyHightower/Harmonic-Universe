export interface SearchItem {
    id: string | number | null;
    label: string | null;
    category:string;
    path: string;
}

export interface SearchProps {
    onClose: () => void;
}