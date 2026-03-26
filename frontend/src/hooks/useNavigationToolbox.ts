
import { setCurrentCharacter } from "../features/Character/characterSlice";
import { setCurrentLocation } from "../features/Location/locationSlice";
import { setCurrentNote } from "../features/Note/noteSlice";
import { setCurrentUniverse } from "../features/Universe/universeSlice";
import { useAppDispatch } from "./useSetterToolbox";
import { useNavigate } from "react-router-dom";




// ! input an object, set that object as the current and navigates to that detailed object page. 
export const useNavigationToolbox = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const handleModelAction = (item: any, type: 'character' | 'universe' | 'note' | 'location', shouldNavigate: boolean = true) => {
        const id = item[`${type}_id`] || item.id;
        const path = `${type}s`;
        const actionMap = {
            character: setCurrentCharacter,
            universe: setCurrentUniverse,
            note: setCurrentNote,
            location: setCurrentLocation
        };
        dispatch(actionMap[type](item));

        if (shouldNavigate) {
            navigate(`/${path}/${id}`)
        }
    };

    return { handleModelAction };
};