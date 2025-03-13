import React from 'react';

interface BlackboxSuggestionProps {
    suggestion: string;
    onAccept: () => void;
    onDismiss: () => void;
}

export const BlackboxSuggestion: React.FC<BlackboxSuggestionProps> = ({
    suggestion,
    onAccept,
    onDismiss
}) => {
    return (
        <div className="blackbox-suggestion">
            <pre className="suggestion-content">{suggestion}</pre>
            <div className="suggestion-actions">
                <button onClick={onAccept}>Accept</button>
                <button onClick={onDismiss}>Dismiss</button>
            </div>
        </div>
    );
};
