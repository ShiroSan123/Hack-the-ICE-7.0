import { apiClient } from './apiClient';
import { Benefit } from '../types';

export const benefitsApi = {
	getAll: async (): Promise<Benefit[]> => {
		return apiClient.get<Benefit[]>('/mock-data/benefits.json');
	},

	getById: async (id: string): Promise<Benefit | undefined> => {
		const benefits = await benefitsApi.getAll();
		return benefits.find(b => b.id === id);
	},

	filterByRegion: async (region: string): Promise<Benefit[]> => {
		const benefits = await benefitsApi.getAll();
		return benefits.filter(b => b.regions.includes(region) || b.regions.includes('all'));
	},

	filterByTargetGroup: async (targetGroup: string): Promise<Benefit[]> => {
		const benefits = await benefitsApi.getAll();
		return benefits.filter(b => b.targetGroups.includes(targetGroup as any));
	},
};