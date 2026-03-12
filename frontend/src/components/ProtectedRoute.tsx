import { Navigate, Outlet} from 'react-router-dom';
import { useAppSelector } from '../hooks/universal'; // Your typed selector



export const ProtectedRoute = () => {
    const { isAuthenticated , isLoading} = useAppSelector((state) => state.auth);

    if(isLoading) {
        return <div> Verifying Credentials ...</div>;
    }
    if (!isAuthenticated){
        return <Navigate to="/login" replace />;
    }
    return <Outlet/>;
};
