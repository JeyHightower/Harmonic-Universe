import { type ErrorDisplayProps } from "../../types/errorDisplayProps"
import styles from '../General.module.css'
export const ErrorDisplay = ({ message, onRetry }: ErrorDisplayProps) => {

    return (
        <div className={styles.errorContainer}>
            <p> Oops! {message}</p>
            <button onClick={onRetry} className={styles.retryBtn}>
                Reload
            </button>
        </div>
    )

}