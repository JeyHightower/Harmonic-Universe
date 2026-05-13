import { useState, useMemo } from "react"
import { useAppSelector } from "../../hooks/useSetterToolbox";
import type { ComponentStatus } from "../../types/componentStatus";
import type { SearchItem, SearchProps } from "../../types/searchItem";
import { useNavigate } from "react-router-dom";
import { Spinner } from "../Universal/Spinner";




export const Search = ({ onClose }: SearchProps) => {

    const [query, setQuery] = useState('');
    const navigate = useNavigate();


    const { allUniverses, isLoading: uniLoading, error: uniError } = useAppSelector((state) => state.universe);
    const { allCharacters, isLoading: charLoading, error: charError } = useAppSelector((state) => state.character);
    const { allNotes, isLoading: noteLoading, error: noteError } = useAppSelector((state) => state.note);
    const { allLocations, isLoading: locLoading, error: locError } = useAppSelector((state) => state.location);

    const status: ComponentStatus = (() => {
        if (uniLoading || charLoading || noteLoading || locLoading) return 'loading';
        if (uniError && charError && noteError && locError) return 'error';
        if (!allUniverses?.length && !allCharacters?.length && !allNotes?.length && !allLocations?.length) return 'empty';
        return 'success';
    })();
    
    
    const allItems = useMemo((): SearchItem[] => {
        return [
            ...(allUniverses ?? []).map((u) => ({ id: u?.universe_id, label: u?.name, category: 'Universe', path: `/universes/${u?.universe_id}` })),
            ...(allCharacters ?? []).map((c) => ({ id: c?.character_id, label: c?.name, category: 'Character', path: `/characters/${c?.character_id}` })),
            ...(allNotes ?? []).map((n) => ({ id: n?.note_id, label: n?.title, category: 'Note', path: `/notes/${n?.note_id}` })),
            ...(allLocations ?? []).map((l) => ({ id: l?.location_id, label: l?.name, category: 'Location', path: `/locations/${l?.location_id}` }))
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

        <div className="search" onClick={handleClose}>
            <div className="searchContainer" onClick={(e) => e.stopPropagation()}>


                <input
                    autoFocus
                    onKeyDown={handleKeyDown}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search Here..."
                />

                <div className="resultList">
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
                                    className="resultItem"
                                    onClick={() => handleNavigate(item.path)}
                                >

                                    <span>{item.label}</span>
                                    <small>{item.category}</small>
                                </div>
                            ))}


                            {query && results.length === 0 && (
                                <p className="emptyResults">No matches for "{query}"</p>
                            )}
                        </>
                    )}


                </div>


            </div>
        </div>

    )
}




