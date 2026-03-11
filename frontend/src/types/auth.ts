import {type  User } from './user';

export interface AuthResponse {
    user: User;
    token: string
}

export type LoginRequest = {
password:Password
} & ({ username: string; email?:never } | { email: string ; username?:never });

export type Password = string;
export type LoginMethod = 'username' | 'email';


