import {type  User } from './user';

export interface AuthResponse {
    user: User;
    token: string
}


export type LoginRequest = {
    password: string;
} & ({ username: string; email?:never } | { email: string ; username?:never });


export type LoginMethod = 'username' | 'email';