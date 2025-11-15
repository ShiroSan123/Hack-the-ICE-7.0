import { apiClient } from './apiClient';
import { UserProfile } from '../types/user';

export const userApi = {
	login: async (phone: string): Promise<UserProfile> => {
		// Mock login
		const user: UserProfile = {
			id: 'user-1',
			phone,
			region: 'xxxxxxxxx',
			category: 'pensioner',
			interests: [],
			role: 'self',
			simpleModeEnabled: true,
			name: 'Пользователь',
		};
		return apiClient.post<UserProfile>('/api/auth/login', { phone });
	},

	updateProfile: async (user: UserProfile): Promise<UserProfile> => {
		return apiClient.put<UserProfile>(`/api/users/${user.id}`, user);
	},
};
