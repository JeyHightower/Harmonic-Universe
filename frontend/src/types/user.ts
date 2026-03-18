export interface User {
    userId: number;
    name: string;
    username: string;
    isAdmin: boolean;
    email: string;
    bio: string | null;
    password: string
}

export type UserDraft = Omit<User, 'userId' | 'isAdmin' > & {isAdmin: boolean};

export type AdminDraft = Omit<User, 'userId' | 'isAdmin'> & {isAdmin: true};
export interface AdminState {
    allUsers: User[],
    isLoading: boolean,
    error: string | null
}