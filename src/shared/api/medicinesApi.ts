import { apiClient } from './apiClient';
import { Medicine } from '../types';

export const medicinesApi = {
	getAll: () => apiClient.get<Medicine[]>('/mock-data/medicines.json'),
};
