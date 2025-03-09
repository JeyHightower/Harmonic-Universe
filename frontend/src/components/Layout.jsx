import { useCallback, useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { MODAL_TYPES } from '../constants/modalTypes';
import { useModal } from '../contexts/ModalContext';
import api from '../api/client';
import { endpoints } from '../api/endpoints';
import { login } from '../features/auth/authSlice';
import Navbar from './Navbar';
import Footer from './Footer';

function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { openModal } = useModal();

    // Add effect to handle URL parameters
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const modalParam = searchParams.get('modal');
        const demoParam = searchParams.get('demo');

        if (modalParam === 'login') {
            console.log('Opening login modal from URL parameter');
            openModal(MODAL_TYPES.LOGIN);
        } else if (modalParam === 'register') {
            console.log('Opening register modal from URL parameter');
            openModal(MODAL_TYPES.REGISTER);
        }

        // Handle demo login if the demo parameter exists
        if (demoParam === 'true') {
            console.log('Processing demo login from URL parameter');
            handleDemoLogin();
        }
    }, [location.search, openModal]);

    // Demo login handler
    const handleDemoLogin = async () => {
        try {
            console.log('Attempting demo login');

            // Demo credentials
            const demoCredentials = {
                email: "demo@example.com",  // Adjust to match your actual demo account
                password: "demo123"        // Adjust to match your actual demo password
            };

            // Try API endpoints in sequence until one works
            let response = null;
            let error = null;

            // Try endpoints in order
            const endpointOptions = [
                endpoints.auth.demoLogin,
                endpoints.auth.login,
                '/api/auth/demo-login',
                '/api/v1/auth/demo-login',
                'http://localhost:8000/api/auth/demo-login',
                'http://localhost:5001/api/auth/demo-login'
            ];

            // Try each endpoint until one works
            for (const endpoint of endpointOptions) {
                try {
                    console.log(`Trying demo login with endpoint: ${endpoint}`);
                    response = await api.post(endpoint, demoCredentials);

                    if (response.status === 200 || response.status === 201) {
                        console.log(`Demo login successful with endpoint: ${endpoint}`);
                        break; // Exit the loop if successful
                    }
                } catch (err) {
                    console.error(`Error with endpoint ${endpoint}:`, err);
                    error = err;
                }
            }

            // If no endpoint worked, throw the last error
            if (!response) {
                throw error || new Error('All demo login endpoints failed');
            }

            const data = response.data;
            console.log('Demo login response:', data);

            // Store tokens
            if (data.token) {
                localStorage.setItem('accessToken', data.token);
            }
            if (data.access_token) {
                localStorage.setItem('accessToken', data.access_token);
            }
            if (data.refresh_token) {
                localStorage.setItem('refreshToken', data.refresh_token);
            }

            // Update auth state
            dispatch(login(data.user));

            // Clear URL parameters
            navigate('/dashboard', { replace: true });
        } catch (error) {
            console.error('Demo login failed:', error);
            // You can show an error notification here
        }
    };

    return (
        <div className="app-layout">
            <Navbar />
            <main className="app-content">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}

export default Layout;
