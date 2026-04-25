import { useAppDispatch, useAppSelector, useSetterToolbox } from "../../hooks/useSetterToolbox"
import type { ComponentStatus } from "../../types/componentStatus";
import { useModalToolbox } from "../../hooks/useModalToolbox";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllLocationsInUniverse, setCurrentLocation } from "../../features/Location/locationSlice";
import type { AppLocation } from "../../types/location";
import { GenericModal } from "../Universal/GenericModal";
import { EntityManager } from "../Universal/EntityManager";



export const Locations = () => {

    const { allLocations, isLoading, error } = useAppSelector((state) => state.location);
    const [status, setStatus] = useState<ComponentStatus>('idle');
    const { useBooleanSetter } = useSetterToolbox();
    const locationModal = useBooleanSetter(false);
    const [selectedLocation, setSelectedLocation] = useState<AppLocation | null>(null);
    const locationModalInfo = useModalToolbox(selectedLocation || {}, 'location');
    const dispatch = useAppDispatch();
    const navigate = useNavigate();


    useEffect(() => {
        if (isLoading) {
            setStatus('loading')
        } else if (error) {
            setStatus('error')
        } else if (allLocations.length === 0) {
            setStatus('empty')
        } else {
            setStatus('success')
        }
    }, [isLoading, error, allLocations])


    const handleLocationEnter = (e: React.MouseEvent, location: AppLocation) => {
        e.stopPropagation();
        dispatch(setCurrentLocation(location));
        navigate(`/locations/${location.location_id}`);
    }

    const locationHandleCreate = () => {

        setSelectedLocation(null);
        locationModalInfo.reset();
        locationModal.setTrue();
    }

    const locationHandleEdit = (location: AppLocation) => {
        setSelectedLocation(location);
        locationModal.setTrue();
    }



    return (

        <>
            <EntityManager
                type="location"
                data={allLocations}
                status={status}
                error={error}
                onAdd={locationHandleCreate}
                onEdit={locationHandleEdit}
                onEnter={handleLocationEnter}
                onRetry={() => dispatch(getAllLocationsInUniverse())}
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
                isOpen={locationModal.boolean}
                onClose={locationModal.setFalse}
                toolbox={locationModalInfo}
                item={selectedLocation}
            />


        </>


    )

}