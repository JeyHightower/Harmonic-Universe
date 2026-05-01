import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/useSetterToolbox";
import { Spinner } from "../Universal/Spinner";
import { getProfile } from "../../features/User/userActions";
import { ConnectionGallery } from "../Universal/ConnectionGallery";
import styles from './Dashboard.module.css';
import { getAllUniverses } from "../../features/Universe/universeActions";
import { getAllCharacters } from "../../features/Character/characterActions";
import { getAllNotes } from "../../features/Note/noteActions";
import { getAllLocationsInUniverse } from "../../features/Location/locationActions";



export const Dashboard = () => {
    const dispatch = useAppDispatch();
    const { user, isLoading: authLoading } = useAppSelector(state => state.auth);
    
    // Selectors
    const { allUniverses, isLoading: uniLoading } = useAppSelector(state => state.universe);
    const { allCharacters, isLoading: charLoading } = useAppSelector(state => state.character);
    const { allNotes, isLoading: noteLoading } = useAppSelector(state => state.note);
    const { allLocations, isLoading: locLoading } = useAppSelector(state => state.location);
    const { currentUniverse } = useAppSelector(state => state.universe);


   


    useEffect(() => {
                if (!user) {
                    dispatch(getProfile());
                }
            }, [user,dispatch]);

            

    // 2. Fetching Logic (The Engine Trigger)
    useEffect(() => {
        if(!user) return; // Wait until slices exist

        if(!allUniverses?.length) dispatch(getAllUniverses());
        if(!allCharacters?.length) dispatch(getAllCharacters());
        if(!allNotes?.length) dispatch(getAllNotes());
        if(currentUniverse?.universe_id && !allLocations?.length){
            dispatch(getAllLocationsInUniverse(currentUniverse?.universe_id))
        }
    }, [dispatch, user]);

    const isLoading = authLoading || uniLoading || charLoading || noteLoading || locLoading;

    
    console.log('ALL UNIVERSES', allUniverses);
    // 3. Data Filtering (The Logic)
    // Because of the Guard above, we know these arrays exist here.
    const userUniverses = useMemo(() => allUniverses ?? [],[allUniverses]);
    const userCharacters = useMemo(() => allCharacters ?? [], [allCharacters, user]);
    const userNotes = useMemo(() => allNotes ?? [], [allNotes]);
    const userLocations = useMemo(() => allLocations ?? [], [allLocations, user]);

    // 4. UI Mapping (The System)
    const sections = useMemo(() => [
        { title: 'Your Universes', items: userUniverses, type: 'universe', loading: uniLoading },
        { title: 'Your Characters', items: userCharacters, type: 'character', loading: charLoading },
        { title: 'Your Notes', items: userNotes, type: 'note', loading: noteLoading },
        { title: 'Your Locations', items: userLocations, type: 'location', loading: locLoading }
    ], [userUniverses, userCharacters, userNotes, userLocations, uniLoading, charLoading, noteLoading, locLoading]);


    // Loading State



    console.log('Dashboard data:', {
        userUniverses: userUniverses.length,
        userCharacters: userCharacters.length,
        userId: user?.user_id
    });

    // Add this RIGHT NOW
console.log('FULL USER OBJECT:', user);
console.log('USER KEYS:', Object.keys(user || {}));
console.log('Sample Universe Object Keys:', allUniverses?.[0] ? Object.keys(allUniverses[0]) : 'No data');

if(isLoading || !user){
    return <Spinner />
}



    return (
        <>
            <h1>{user ? `Welcome ${user.name}` : 'Welcome Demo-user'}</h1>
            {sections.map(({ title, items, type, loading }) => (
                <div key={type} className={styles.container}>
                    {!loading ? (
                        <ConnectionGallery title={title} items={items} type={type as 'universe' | 'character' | 'note' | 'location'} />
                    ) : (
                        <Spinner />
                    )}
                </div>
            ))}
        </>
    );
};






// export const Dashboard = () => {

//     const { user, isLoading: authLoading, error: authError } = useAppSelector(state => state.auth);
//     const { allUniverses, isLoading: uniLoading, error: uniError } = useAppSelector(state => state.universe);
//     const { allCharacters, isLoading: charLoading, error: charError } = useAppSelector(state => state.character);
//     const { allNotes, isLoading: noteLoading, error: noteError } = useAppSelector(state => state.note);
//     const { allLocations, isLoading: locLoading, error: locError } = useAppSelector(state => state.location);
//     const { currentUniverse } = useAppSelector(state => state.universe);
//     const dispatch = useAppDispatch();


//     useEffect(() => {
//         // RULE: Guard against undefined by providing an empty array fallback
//         if ((allUniverses ?? []).length === 0) dispatch(getAllUniverses());
//         if ((allCharacters ?? []).length === 0) dispatch(getAllCharacters());
//         if ((allNotes ?? []).length === 0) dispatch(getAllNotes());
//         if (currentUniverse?.universe_id) {
//             if ((allLocations ?? []).length === 0) {
//                 dispatch(getAllLocationsInUniverse(currentUniverse.universe_id));
//             }
//         }
//     }, [
//         dispatch, 
//         allUniverses?.length,  
//         allCharacters?.length, 
//         allNotes?.length,      
//         allLocations?.length,  
//         currentUniverse
//     ]);
        

//     const userUniverses = useMemo(() => (allUniverses ?? []).filter((u) => u.user_id === user?.user_id), [allUniverses, user]);
//     const userCharacters = useMemo(() => (allCharacters ?? []).filter((c) => c.user_id === user?.user_id), [allCharacters, user]);
//     const userNotes = useMemo(() => (allNotes ?? []).filter((n) => n.user_id === user?.user_id), [allNotes, user]);
//     const userLocations = useMemo(() => (allLocations ?? []).filter((l) => l.user_id === user?.user_id), [allLocations, user]);

//     const sections = [
//         { title: 'Your Universes', items: userUniverses, type: 'universe', loading: uniLoading },
//         { title: 'Your Characters', items: userCharacters, type: 'character', loading: charLoading },
//         { title: 'Your Notes', items: userNotes, type: 'note', loading: noteLoading },
//         { title: 'Your Locations', items: userLocations, type: 'location', loading: locLoading }
//     ] as const;

//     useEffect(() => {
//         if (!user) {
//             getProfile();
//         }
//     }, [user]);

   


//     if (authLoading) return <Spinner />;

//     return (
//         <>
//             <h1>{user ? `Welcome ${user.name}` : 'Welcome Demo-user'}</h1>
//             {sections.map(({ title, items, type, loading }) => (
//                 <div key={type} className={styles.container}>
//                     {!loading ? (<ConnectionGallery title={title} items={items} type={type} />) : (<Spinner />)}
//                 </div>
//             ))}
//         </>

//     );

// };




