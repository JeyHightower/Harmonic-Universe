import {type  User } from './user';

export interface LoginResponse {
    user: User;
    token: string
}

export type LoginRequest = {
password:Password
} & ({ username: string; email?:never } | { email: string ; username?:never });

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface RegisterResponse { 
    user: User;
    token: string;
}

export type Password = string;
export type LoginMethod = 'username' | 'email';


