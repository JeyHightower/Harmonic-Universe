import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/useSetterToolbox";
import { Spinner } from "../Universal/Spinner";
import { getProfile } from "../../features/User/userActions";
import { ConnectionGallery } from "../Universal/ConnectionGallery";
import { getAllUniverses } from "../../features/Universe/universeActions";
import { getAllCharacters } from "../../features/Character/characterActions";
import { getAllNotes } from "../../features/Note/noteActions";
import { getAllLocations } from "../../features/Location/locationActions";


export const Dashboard = () => {
    const dispatch = useAppDispatch();
    const { user, isLoading: authLoading } = useAppSelector(state => state.auth);
    
    // Selectors
    const { allUniverses, isLoading: uniLoading } = useAppSelector(state => state.universe);
    const { allCharacters, isLoading: charLoading } = useAppSelector(state => state.character);
    const { allNotes, isLoading: noteLoading } = useAppSelector(state => state.note);
    const { allLocations, isLoading: locLoading } = useAppSelector(state => state.location);


    useEffect(() => {
                if (!user) {
                    dispatch(getProfile());
                }
            }, [user,dispatch]);

            
    useEffect(() => {
        if(!user) return;

        if(!allUniverses?.length) dispatch(getAllUniverses());
        if(!allCharacters?.length) dispatch(getAllCharacters());
        if(!allNotes?.length) dispatch(getAllNotes());
        if(!allLocations?.length) dispatch(getAllLocations());
    }, [dispatch, user]);

    const isLoading = authLoading || uniLoading || charLoading || noteLoading || locLoading;


    // 3. Data Filtering (The Logic)
    // Because of the Guard above, we know these arrays exist here.
    const userUniverses = useMemo(() => allUniverses ?? [],[allUniverses, user]);
    const userCharacters = useMemo(() => allCharacters ?? [], [allCharacters, user]);
    const userNotes = useMemo(() => allNotes ?? [], [allNotes, user]);
    const userLocations = useMemo(() => allLocations ?? [], [allLocations, user]);

    const sections = useMemo(() => [
        { title: 'Your Universes', items: userUniverses, type: 'universe', loading: uniLoading },
        { title: 'Your Characters', items: userCharacters, type: 'character', loading: charLoading },
        { title: 'Your Notes', items: userNotes, type: 'note', loading: noteLoading },
        { title: 'Your Locations', items: userLocations, type: 'location', loading: locLoading }
    ], [userUniverses, userCharacters, userNotes, userLocations, uniLoading, charLoading, noteLoading, locLoading]);


if(isLoading || !user){
    return <Spinner />
}

    return (
        <>
            <h1>{user ? `Welcome ${user.name}` : 'Welcome Demo-user'}</h1>
            {sections.map(({ title, items, type, loading }) => (
                <div key={type} className="container">
                    <div className="displayCard">
                    {!loading ? (
                        <ConnectionGallery title={title} items={items} type={type as 'universe' | 'character' | 'note' | 'location'} />
                    ) : (
                        <Spinner />
                    )}
                    </div>
                </div>
            ))}
        </>
    );
};








