import { useState, useEffect, useMemo } from "react"
import { useAppSelector } from "../../hooks/useSetterToolbox";
import type { ComponentStatus } from "../../types/componentStatus";
import type { SearchItem, SearchProps } from "../../types/searchItem";
import { useNavigate } from "react-router-dom";
import { Spinner } from "../Universal/Spinner";
import styles from '../General.module.css'




export const Search = ({ onClose }: SearchProps) => {

    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<ComponentStatus>('idle');
    const navigate = useNavigate();


    const { allUniverses, isLoading: uniLoading, error: uniError } = useAppSelector((state) => state.universe);
    const { allCharacters, isLoading: charLoading, error: charError } = useAppSelector((state) => state.character);
    const { allNotes, isLoading: noteLoading, error: noteError } = useAppSelector((state) => state.note);
    const { allLocations, isLoading: locLoading, error: locError } = useAppSelector((state) => state.location);


    
    useEffect(() => {

        if (uniLoading || charLoading || noteLoading || locLoading) {
            setStatus('loading');
            return;
        }

        if (uniError && charError && noteError && locError) {
            setStatus('error');
            return;
        }

        if (allUniverses?.length === 0 && allCharacters?.length === 0 && allNotes?.length === 0 && allLocations?.length === 0) {
            setStatus('empty')
            return;
        }

        setStatus('success')
    }, [allUniverses, allCharacters, allNotes, allLocations, uniLoading, charLoading, noteLoading, locLoading, uniError, charError, noteError, locError])

    const allItems = useMemo((): SearchItem[] => {
        return [
            ...(allUniverses ?? []).map((u) => ({ id: u.universe_id, label: u.name, category: 'Universe', path: `/universes/${u.universe_id}` })),
            ...(allCharacters ?? []).map((c) => ({ id: c.character_id, label: c.name, category: 'Character', path: `/characters/${c.character_id}` })),
            ...(allNotes ?? []).map((n) => ({ id: n.note_id, label: n.title, category: 'Note', path: `/notes/${n.note_id}` })),
            ...(allLocations ?? []).map((l) => ({ id: l.location_id, label: l.name, category: 'Location', path: `/locations/${l.location_id}` }))
        ]
    }, [allUniverses, allCharacters, allNotes, allLocations])


    const results = useMemo(() => {
        if (!query) return [];
        return allItems?.filter(item =>
            item.label?.toLowerCase().includes(query.toLowerCase())
        )
    }, [query, allItems])

    const handleClose = () => {
        setQuery("");
        onClose();
    }


    const handleNavigate = (path: string) => {
        navigate(path);
        handleClose();
    }



    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleClose();
        }
    }

    return (

        <div className={styles.search} onClick={handleClose}>
            <div className={styles.searchContainer} onClick={(e) => e.stopPropagation()}>


                <input
                    autoFocus
                    onKeyDown={handleKeyDown}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search Here..."
                />

                <div className={styles.resultList}>
                    {status === 'loading' && <Spinner />}
                    {status === 'error' && (
                        <p> There was an Error.</p>
                    )}
                    {status === 'empty' && (
                        <p>No items available to search.</p>
                    )}
                    {status === 'success' && (
                        <>
                            {results.map((item) => (
                                <div
                                    key={`${item.category}-${item.id}`}
                                    className={styles.resultItem}
                                    onClick={() => handleNavigate(item.path)}
                                >

                                    <span>{item.label}</span>
                                    <small>{item.category}</small>
                                </div>
                            ))}


                            {query && results.length === 0 && (
                                <p className={styles.emptyResults}>No matches for "{query}"</p>
                            )}
                        </>
                    )}


                </div>


            </div>
        </div>

    )
}




