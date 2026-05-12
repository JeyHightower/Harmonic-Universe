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
    onDelete,
    onRetry,
    renderCardContent,
    idField

}: EntityManagerProps<T>) => {

    const Wrapper = isSection ? 'div' : 'main';

    return (

        <Wrapper className={isSection ? "sectionContainer" : "pageContainer"}>
            {!isSection && (
                <header>
                    <h1> Your {type}s</h1>
                    <button onClick={onAdd}>+ CREATE {type.toUpperCase()}</button>
                </header>
            )}
            <div className="contentArea">
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
                    <section className="grid">
                        {data?.map((item:any) => (
                            <div
                                key={String(item?.[idField])}
                                className="card">
                                <div className="cardPreview"
                                // onClick={() => onEdit(item)}
                            >
                                {renderCardContent(item)}
                                </div>
                                <footer className="cardFooter">
                                <button 
                                    type='button' 
                                    className="viewButton"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEnter(e, item)}}
                                        >
                                    View {type}
                                </button>
                                <button 
                                    type='button' 
                                    className="editButton"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(item)}}
                                        >
                                    Edit {type}
                                </button>
                                <button 
                                    type='button' 
                                    className="deleteButton"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(item)}}
                                        >
                                    Delete {type}
                                </button>

                                </footer>
                            </div>
                        ))}
                    </section>
                )}

            </div>
        </Wrapper>


    )

}