export interface User {
    user_id: number;
    username: string;
    is_admin: boolean;
    email: string;
    bio: string | null
}

export interface AuthResponse {
    user: User;
    token: string
}


export type LoginRequest = {
    password: string;
} & ({ username: string; email?:never } | { email: string ; username?:never });
