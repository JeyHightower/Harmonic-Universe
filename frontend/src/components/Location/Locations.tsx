import { useAppDispatch, useAppSelector} from "../../hooks/useSetterToolbox"
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
    const { currentUniverse } = useAppSelector((state) => state.universe);    
    const [status, setStatus] = useState<ComponentStatus>('idle');
    const [activeModal, setActiveModal] = useState<{type:string, item:AppLocation | null}>({type:"", item:null})
    const locationModalInfo = useModalToolbox(activeModal.item || {}, 'location');
    const dispatch = useAppDispatch();
    const navigate = useNavigate();


    useEffect(() => {
        if (isLoading) {
            setStatus('loading')
            return;
        }
        if (error) {
            setStatus('error')
            return;
        }
        if (allLocations.length === 0) {
            setStatus('empty')
            return;
        }
        setStatus('success')

    }, [isLoading, error, allLocations])


    const handleLocationEnter = (e: React.MouseEvent, location: AppLocation) => {
        e.stopPropagation();
        dispatch(setCurrentLocation(location));
        navigate(`/locations/${location.location_id}`);
    }

    const locationHandleCreate = () => {

        setActiveModal({type:'location', item:null})
        locationModalInfo.reset();
        
    }

    const locationHandleEdit = (location: AppLocation) => {
        setActiveModal({type:'location', item:location})
        
    }
    
    const handleClose = () => {
        setActiveModal({type:'', item:null})
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
                onRetry={() =>{
                    if(currentUniverse?.universe_id){
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
                isOpen={activeModal.type==='location'}
                onClose={handleClose}
                toolbox={locationModalInfo}
                item={activeModal.item}
            />


        </>


    )

}