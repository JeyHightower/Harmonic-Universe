import type { User } from "./user";

export interface DashboardDataType extends User {
    accountStatus: 'active' | 'pending' | 'suspended';
    recentActivity: string[];
}