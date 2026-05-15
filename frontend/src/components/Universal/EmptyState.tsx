import type { EmptyStateProps } from '../../types/emptyStateProps';

export const EmptyState = ({type , onAdd}: EmptyStateProps) => (
    <div className="emptyStateContainer">
        <p>No {type}s linked yet.</p>
        <button onClick={onAdd}>
            + Add a {type}
        </button>
    </div>
);