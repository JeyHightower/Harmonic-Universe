export interface User {
    user_id: number;
    name: string;
    username: string;
    is_admin: boolean;
    email: string;
    bio: string | null;
    password: string
}

export type UserDraft = Omit<User, 'user_id' | 'is_admin' > & {is_admin: boolean};

export type AdminDraft = Omit<User, 'user_id' | 'is_admin'> & {is_admin: true};
export interface AdminState {
    allUsers: User[],
    isLoading: boolean,
    error: string | null
}