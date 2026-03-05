import { useGetTestMessageQuery } from '../api/apiSlice';

export const TestConnection = () => {
    const { data, error, isLoading } = useGetTestMessageQuery();

    if (isLoading) return <div>Connecting...</div>;
    if(error) return <div>Error connecting to flask!</div>;

    return <div> Backend says: {JSON.stringify(data)}</div>;
};