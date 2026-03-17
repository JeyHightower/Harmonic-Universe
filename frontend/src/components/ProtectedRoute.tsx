import { Navigate, Outlet} from 'react-router-dom';
import { useAppSelector } from '../hooks/useUniversalToolbox'; // Your typed selector
import { Spinner } from './Universal/Spinner';



export const ProtectedRoute = () => {
    const { isAuthenticated , isLoading} = useAppSelector((state) => state.auth);

    if(isLoading) {
        return <div> <Spinner /> </div>;
    }
    if (!isAuthenticated){
        return <Navigate to="/login" replace />;
    }
    return <Outlet/>;
};
