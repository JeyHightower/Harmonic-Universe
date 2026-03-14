export interface User {
    userId: number;
    name: string;
    username: string;
    isAdmin: boolean;
    email: string;
    bio: string | null;
}

export type UserDraft = Omit<User, 'userId' | 'isAdmin' > & {isAdmin: false};

export type AdminDraft = Omit<User, 'userId' | 'isAdmin'> & {isAdmin: true};