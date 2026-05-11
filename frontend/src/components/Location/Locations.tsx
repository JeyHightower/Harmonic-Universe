import { useAppDispatch, useAppSelector } from "../../hooks/useSetterToolbox"
import type { ComponentStatus } from "../../types/componentStatus";
import { useModalToolbox } from "../../hooks/useModalToolbox";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAllLocations, getAllLocationsInUniverse, setCurrentLocation } from "../../features/Location/locationSlice";
import type { AppLocation } from "../../types/location";
import { GenericModal } from "../Universal/GenericModal";
import { EntityManager } from "../Universal/EntityManager";
import { getAllUniverses } from "../../features/Universe/universeSlice";
import { FORM_CONFIG, getCurrentLocation } from "../../helpers";

export const Locations = () => {

    const { allLocations, currentLocation, isLoading, error } = useAppSelector((state) => state.location);
    const { user, isLoading: userLoading, error: userError } = useAppSelector(state => state.auth);
    const { currentUniverse, allUniverses, isLoading: uniLoading, error: uniError } = useAppSelector((state) => state.universe);
    const [activeModal, setActiveModal] = useState<{ type: string, item: AppLocation | null }>({ type: "", item: null })
    const locationModalInfo = useModalToolbox<AppLocation>((activeModal.item || {}) as any, 'location');
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const user_id = user?.user_id;


    const status: ComponentStatus = (() => {
        if (isLoading || userLoading) return 'loading';
        if (error || userError) return 'error';
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
    }, [currentLocation, allLocations, dispatch]);

    useEffect(() => {
        if (!allUniverses.length) {
            dispatch(getAllUniverses());
        }
    }, [allUniverses, uniError, uniLoading])


    const universeOptions: { value: number | null; label: string | null }[] = useMemo(() => {
        return allUniverses?.map((u) => ({
            value: u.universe_id,
            label: u.name
        }));
    }, [allUniverses]);

    const hydratedLocationFields = useMemo(() =>
        FORM_CONFIG.location.map((field: any) => {
            switch (field.name) {
                case 'universe_id':
                    return { ...field, options: universeOptions, defaultValue: currentUniverse?.universe_id };
                default:
                    return field;
            }
        }), [universeOptions, currentUniverse]
    );



    const handleLocationEnter = (e: React.MouseEvent, location: AppLocation) => {
        e.stopPropagation();
        dispatch(setCurrentLocation(location));
        navigate(`/locations/${location.location_id}`);
    }


    const locationHandleCreate = () => {
        if (!user || !allUniverses.length) return;
        locationModalInfo.reset();
        setActiveModal({ type: 'location', item: null });
        (locationModalInfo as any).updateField('user_id', user_id);
    }


    const locationHandleEdit = (location: AppLocation) => {
        if (!user || !allUniverses.length) return;
        setActiveModal({ type: 'location', item: location });

    }


    const locationHandleDelete = (location:AppLocation) => {
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
                fields={hydratedLocationFields}
            />
        </>


    )

}

// useEffect(() => {
//     if (!currentUniverse) {
//         const universe = getCurrentUniverse();
//         if (universe) {
//             dispatch(setCurrentUniverse(universe))
//         } else {
//             console.log('No universe found in storage. ')
//         }
//     }
// }, [currentUniverse, dispatch])


// useEffect(() => {
//     if (!allUniverses?.length) {
//         dispatch(getAllUniverses())
//     }
// }, [allUniverses, dispatch])