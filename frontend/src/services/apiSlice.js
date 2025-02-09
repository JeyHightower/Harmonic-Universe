import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User', 'Audio', 'Physics', 'Visualization', 'AI'],
  endpoints: builder => ({
    getUser: builder.query({
      query: () => '/api/auth/user',
      providesTags: ['User'],
    }),
    updateUser: builder.mutation({
      query: userData => ({
        url: '/api/auth/user',
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    updateUserPreferences: builder.mutation({
      query: preferences => ({
        url: '/api/auth/preferences',
        method: 'PUT',
        body: preferences,
      }),
      invalidatesTags: ['User'],
    }),
    updateUserAvatar: builder.mutation({
      query: formData => ({
        url: '/api/auth/avatar',
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetUserQuery,
  useUpdateUserMutation,
  useUpdateUserPreferencesMutation,
  useUpdateUserAvatarMutation,
} = apiSlice;
