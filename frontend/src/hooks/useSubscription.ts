import { useAppSelector } from "./useSetterToolbox";

export const useSubscription = (type: 'universe' | 'character' | 'note' | 'location' | 'auth' | 'admin') => {

    const universe = useAppSelector(state => state.universe);
    const character = useAppSelector(state => state.character);
    const note = useAppSelector(state => state.note);
    const location = useAppSelector(state => state.location);
    const auth = useAppSelector(state => state.auth);
    const admin = useAppSelector(state => state.admin);


    const subscription = {
        universe,
        character,
        note,
        location,
        auth,
        admin
    }

    return subscription[type];

}