import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { AuthResponse, LoginRequest } from '../types/auth';
import type { User } from '../types/user';
import { type RootState } from '../store/store';

export const apislice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api',
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).auth.token;
            if (token){
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    endpoints:(builder) => ({
        getTestMessage: builder.query<any, void>({
            query: () => '/test-connection',
        }),
        getUsers: builder.query<User[], void>({
            query: () => '/users',
        }),
        login: builder.mutation<AuthResponse, LoginRequest>({
            query:(credentials) => ({
                url:'/login',
                method: 'POST',
                body:credentials,
            }),
        }),
    }),
});

export const { useGetTestMessageQuery, useGetUsersQuery, useLoginMutation } = apislice;