import type { ComponentState } from "react";

export interface EntityManagerProps<T> {
    type: string;
    isSection?: boolean;
    data: T[];
    status: ComponentState;
    error: string | null;
    onAdd: () => void;
    onRetry: () => void;
    onEdit: (item:T) => void;
    onDelete: (item:T) => void;
    onEnter: (e:React.MouseEvent, item:T) => void;
    renderCardContent: (item:T) => React.ReactNode
    idField: keyof T;
}