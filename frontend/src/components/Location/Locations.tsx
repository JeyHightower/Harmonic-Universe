import { useAppDispatch, useAppSelector } from "../../hooks/useSetterToolbox"
import type { ComponentStatus } from "../../types/componentStatus";
import { useModalToolbox } from "../../hooks/useModalToolbox";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllLocations, getAllLocationsInUniverse, setCurrentLocation } from "../../features/Location/locationSlice";
import type { AppLocation } from "../../types/location";
import { GenericModal } from "../Universal/GenericModal";
import { EntityManager } from "../Universal/EntityManager";
import { getAllUniverses } from "../../features/Universe/universeSlice";
import { getCurrentLocation } from "../../helpers";
import { useHydratedFields } from "../../hooks/useHydratedFields";

export const Locations = () => {

    const { allLocations, currentLocation, isLoading, error } = useAppSelector((state) => state.location);
    const { user, isLoading: userLoading, error: userError } = useAppSelector(state => state.auth);
    const { currentUniverse, allUniverses, isLoading: uniLoading, error: uniError } = useAppSelector((state) => state.universe);
    const [activeModal, setActiveModal] = useState<{ type: string, item: AppLocation | null }>({ type: "", item: null })
    const locationModalInfo = useModalToolbox<AppLocation>((activeModal.item || {}) as any, 'location');
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const user_id = user?.user_id;
    const hydratedFields = useHydratedFields('location');


    const status: ComponentStatus = (() => {
        if (isLoading || userLoading || uniLoading ) return 'loading';
        if (error || userError || uniError) return 'error';
        if (!user) return 'empty';
        if (!allLocations?.length) return 'empty';
        return 'success';
    })();



    useEffect(() => {
        if (!allLocations?.length) {
            dispatch(getAllLocations());
        }
        if (!currentLocation) {
            const location = getCurrentLocation();
            if (location) {
                dispatch(setCurrentLocation(location));
            }
        }
    }, [dispatch]);


    useEffect(() => {
        if (!allUniverses?.length) {
            dispatch(getAllUniverses());
        }
    }, [dispatch]);


    const handleLocationEnter = (e: React.MouseEvent, location: AppLocation) => {
        e.stopPropagation();
        dispatch(setCurrentLocation(location));
        navigate(`/locations/${location.location_id}`);
    }


    const locationHandleCreate = () => {
        locationModalInfo.reset();
        setActiveModal({ type: 'location', item: null });
        (locationModalInfo as any).updateField('user_id', user_id);
    }


    const locationHandleEdit = (location: AppLocation) => {
        setActiveModal({ type: 'location', item: location });

    }


    const locationHandleDelete = (location: AppLocation) => {
        locationModalInfo.handleDelete(location);
    }


    const handleClose = () => {
        setActiveModal({ type: '', item: null })
    }



    return (

        <>
            <EntityManager
                type="location"
                data={allLocations}
                status={status}
                error={error}
                onDelete={(location) => locationHandleDelete(location)}
                onAdd={() => locationHandleCreate()}
                onEdit={(location) => locationHandleEdit(location)}
                onEnter={(e, location) => handleLocationEnter(e, location)}
                onRetry={() => {
                    if (currentUniverse?.universe_id) {
                        dispatch(getAllLocationsInUniverse(currentUniverse.universe_id))
                    }
                }}
                idField='location_id'
                renderCardContent={(l) => (
                    <>
                        <h3>{l.name}</h3>
                        <p>Description: {l.description || '...'}</p>
                    </>
                )}
            />

            <GenericModal
                type="location"
                isOpen={activeModal.type === 'location'}
                onClose={handleClose}
                toolbox={locationModalInfo}
                item={activeModal.item}
                fields={hydratedFields}
            />
        </>


    )

}
