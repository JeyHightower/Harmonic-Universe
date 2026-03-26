import './Universal.css';

export const EmptyState = ({type}: {type:string}) => (
    <div className="emptyStateContainer">
        <p>No {type}s linked yet.</p>
        <button>
            + Add a {type}
        </button>
    </div>
);