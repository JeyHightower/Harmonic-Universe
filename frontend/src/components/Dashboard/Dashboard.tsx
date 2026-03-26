import { useEffect, useMemo } from "react";
import { useAppSelector } from "../../hooks/useSetterToolbox";
import { Spinner } from "../Universal/Spinner";
import { getProfile } from "../../features/User/userActions";
import { ConnectionGallery } from "../ConnectionGallery";
import styles from './Dashboard.module.css';


const Dashboard = () => {

    const { user, isLoading: authLoading, error: authError } = useAppSelector(state => state.auth);
    const { allUniverses, isLoading: uniLoading, error: uniError } = useAppSelector(state => state.universe);
    const { allCharacters, isLoading: charLoading, error: charError } = useAppSelector(state => state.character);
    const { allNotes, isLoading: noteLoading, error: noteError } = useAppSelector(state => state.note);
    const { allLocations, isLoading: locLoading, error: locError } = useAppSelector(state => state.location);

    const userUniverses = useMemo(() => allUniverses.filter((u) => u.user_id === user?.user_id), [allUniverses, user]);
    const userCharacters = useMemo(() => allCharacters.filter((c) => c.user_id === user?.user_id), [allCharacters, user]);
    const userNotes = useMemo(() => allNotes.filter((n) => n.user_id === user?.user_id), [allNotes, user]);
    const userLocations = useMemo(() => allLocations.filter((l) => l.user_id === user?.user_id), [allLocations, user]);

    const sections = [
        { title: 'Your Universes', items: userUniverses, type: 'universe', loading: uniLoading },
        { title: 'Your Characters', items: userCharacters, type: 'character', loading: charLoading },
        { title: 'Your Notes', items: userNotes, type: 'note', loading: noteLoading },
        { title: 'Your Locations', items: userLocations, type: 'location', loading: locLoading }
    ] as const;

    useEffect(() => {
        if (!user) {
            getProfile();
        }
    }, [user]);


    if (authLoading) return <Spinner />;

    return (
        <>
            <h1>{user ? `Welcome ${user.name}` : 'Welcome Demo-user'}</h1>
            {sections.map(({ title, items, type, loading }) => (
                <div key={type} className={styles.container}>
                    {!loading ? (<ConnectionGallery title={title} items={items} type={type} />) : (<Spinner />)}
                </div>
            ))}
        </>

    );

};




export default Dashboard;