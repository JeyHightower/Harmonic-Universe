import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector, useObjectSetter } from '../../hooks/hooks';
import { loginUser } from '../../features/auth/authActions';
import type { LoginRequest, LoginMethod } from '../../types/auth';


export const Login = () => {
    const [loginMethod, setLoginMethod] = useState<LoginMethod>('username'); //email or username
    
    const {
        data: credentials,
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
            
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
    );
};