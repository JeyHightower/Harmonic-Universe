import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, login, logout, register } from '../store/slices/authSlice';

export const useAuth = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, isAuthenticated, loading, error } = useSelector((state) => state.auth);

    const handleLogin = useCallback(async (credentials) => {
        try {
            await dispatch(login(credentials)).unwrap();
            navigate('/dashboard');
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }, [dispatch, navigate]);

    const handleLogout = useCallback(() => {
        dispatch(logout());
        navigate('/login');
    }, [dispatch, navigate]);

    const handleRegister = useCallback(async (userData) => {
        try {
            await dispatch(register(userData)).unwrap();
            navigate('/login');
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    }, [dispatch, navigate]);

    const checkAuth = useCallback(async () => {
        if (isAuthenticated && !user) {
            try {
                await dispatch(getCurrentUser()).unwrap();
            } catch (error) {
                console.error('Failed to get current user:', error);
                navigate('/login');
            }
        }
    }, [dispatch, navigate, isAuthenticated, user]);

    return {
        user,
        isAuthenticated,
        loading,
        error,
        login: handleLogin,
        logout: handleLogout,
        register: handleRegister,
        checkAuth
    };
};
