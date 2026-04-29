import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector, useSetterToolbox } from '../../hooks/useSetterToolbox';
import { loginUser } from '../../features/Auth/authActions';
import type { LoginRequest, LoginMethod } from '../../types/auth';
import { useNavigate } from 'react-router-dom';


export const Login = () => {
    const { useObjectSetter } = useSetterToolbox();
    const [loginMethod, setLoginMethod] = useState<LoginMethod>('username');
    const navigate = useNavigate();

    const {
        object: credentials,
        updateField,
        setLoginIdentifier
    } = useObjectSetter<LoginRequest>({
        password: '',
        username: ''
    });



    const { isLoading, error } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();


    useEffect(() => {
        setLoginIdentifier(loginMethod, '');
    }, [loginMethod]);



    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await dispatch(loginUser(credentials));
        if (success) {
            navigate('/dashboard');
        }
    };


    const handleDemoLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const demoCredentials: LoginRequest = {
            username: 'demo',
            password: 'demo123'
        }
        const success = await dispatch(loginUser(demoCredentials));
        if (success) {
            navigate('/dashboard')
        }
    }

    return (
        <form onSubmit={handleLogin}>
            <select
                value={loginMethod}
                onChange={(e) => setLoginMethod(e.target.value as LoginMethod)}>
                <option value="username">Username</option>
                <option value="email">Email</option>
            </select>

            <input
                placeholder={loginMethod}
                value={loginMethod === 'username' ? (credentials.username || '') : (credentials.email || '')}
                onChange={(e) => setLoginIdentifier(loginMethod, e.target.value)}
            />

            <input
                type="password"
                placeholder="Password"
                value={credentials.password}
                onChange={(e) => updateField('password', e.target.value)}
            />

            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
            </button>
            <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isLoading}
                style={{ marginTop: '10px', backgroundColor: '#ddd' }}
            >
                Demo Login
            </button>

            {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>

    );
};