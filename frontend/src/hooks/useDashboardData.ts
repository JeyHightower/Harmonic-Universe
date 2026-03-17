import { useAppSelector, useUniversalToolbox} from './useUniversalToolbox';
import { type DashboardDataType } from '../types/dashboard';


export const useDashboardData = () => {
    const {useObjectSetter} = useUniversalToolbox();
    const { user:userData } = useAppSelector((state) => state.auth);

    const initialValue: DashboardDataType = userData ? {
        ...userData,
        accountStatus: 'pending',
        recentActivity: []
    } : {
        userId: 0,
        name: '',
        username: '',
        email: '',
        isAdmin: false,
        bio: '',
        accountStatus: 'pending',
        recentActivity: []
    };
    const { object:uIData, updateField } = useObjectSetter<DashboardDataType>(initialValue);
    const isLoading = !userData;


    return { data:uIData, updateField, isLoading };
}; 