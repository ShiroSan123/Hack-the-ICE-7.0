import { apiClient } from './apiClient';
import { Offer } from '../types/offer';

export const offersApi = {
	getAll: async (): Promise<Offer[]> => {
		return apiClient.get<Offer[]>('/mock-data/offers.json');
	},

	getById: async (id: string): Promise<Offer | undefined> => {
		const offers = await offersApi.getAll();
		return offers.find(o => o.id === id);
	},

	filterByRegion: async (region: string): Promise<Offer[]> => {
		const offers = await offersApi.getAll();
		return offers.filter(o => o.regions.includes(region) || o.regions.includes('all'));
	},
};
