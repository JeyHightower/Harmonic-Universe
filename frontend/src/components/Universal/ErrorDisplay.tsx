import { type ErrorDisplayProps } from "../../types/errorDisplayProps"
export const ErrorDisplay = ({ message, onRetry }: ErrorDisplayProps) => {

    return (
        <div className="errorContainer">
            <p> Oops! {message}</p>
            <button onClick={onRetry} className="retryBtn">
                Reload
            </button>
        </div>
    )

}