import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector, useSetterToolbox } from '../../hooks/useSetterToolbox';
import { loginUser } from '../../features/Auth/authActions';
import type { LoginRequest, LoginMethod } from '../../types/auth';


export const Login = () => {
    const {useObjectSetter} = useSetterToolbox();
    const [loginMethod, setLoginMethod] = useState<LoginMethod>('username'); //email or username
    
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

            
          
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(loginUser(credentials));
    };


    const handleDemoLogin = () => {
        const demoCredentials:LoginRequest = {
            username: 'demo',
            password: 'demo123'
        }
        dispatch(loginUser(demoCredentials))
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
                style={{marginTop:'10px', backgroundColor: '#ddd'}}
                >
                    Demo Login
                </button>
            
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
        
    );
};