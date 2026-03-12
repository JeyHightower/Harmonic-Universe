import { useAppSelector, useObjectSetter } from './universal';
import { type DashboardDataType } from '../types/dashboard';


export const useDashboardData = () => {
    const { user:userData } = useAppSelector((state) => state.auth);

    const initialValue: DashboardDataType = userData ? {
        ...userData,
        accountStatus: 'pending',
        recentActivity: []
    } : {
        user_id: 0,
        username: '',
        email: '',
        is_admin: false,
        bio: '',
        accountStatus: 'pending',
        recentActivity: []
    };
    const { data:uIData, updateField } = useObjectSetter<DashboardDataType>(initialValue);
    const isLoading = !userData;

    return { data:uIData, updateField, isLoading };
}; 