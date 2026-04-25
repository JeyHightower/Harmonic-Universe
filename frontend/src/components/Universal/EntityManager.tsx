import type { EntityManagerProps } from "../../types/entityManager";
import { EmptyState } from "./EmptyState";
import { ErrorDisplay } from "./ErrorDisplay";
import { Spinner } from "./Spinner";

export const EntityManager = <T,>({
    isSection = false,
    type,
    data,
    status,
    error,
    onAdd,
    onEdit,
    onEnter,
    onRetry,
    renderCardContent,
    idField

}: EntityManagerProps<T>) => {

    const Wrapper = isSection ? 'div' : 'main';

    return (

        <Wrapper className={isSection ? styles.sectionContainer : styles.pageContainer}>
            {!isSection && (
                <header>
                    <h1> Your {type}s</h1>
                    <button onClick={onAdd}>+ CREATE {type.toUpperCase()}</button>
                </header>
            )}
            <div className={styles.contentArea}>
                {status === 'loading' && <Spinner />}

                {status === 'error' && error && (
                    <ErrorDisplay
                        message={error}
                        onRetry={onRetry}
                    />
                )}
                {status === 'empty' && (
                    <EmptyState
                        type={type}
                        onAdd={onAdd}
                    />
                )}

                {status === 'success' && (
                    <section className={styles.grid}>
                        {data.map((item) => (
                            <div
                                key={String(item[idField])}
                                className={styles.card}
                                onClick={() => onEdit(item)}
                            >
                                {renderCardContent(item)}
                                <button type='button' onClick={(e) => onEnter(e, item)}>
                                    View {type}
                                </button>
                            </div>
                        ))}
                    </section>
                )}

            </div>
        </Wrapper>


    )

}