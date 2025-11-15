// Моковая API
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const apiClient = {
	get: async <T>(url: string): Promise<T> => {
		await delay(300); // Simulate network delay

		// Fetch from public mock data
		if (url.startsWith('/mock-data/')) {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		}

		throw new Error('Invalid API endpoint');
	},

	post: async <T>(url: string, data: unknown): Promise<T> => {
		await delay(300);
		console.log('POST', url, data);
		return data as T;
	},

	put: async <T>(url: string, data: unknown): Promise<T> => {
		await delay(300);
		console.log('PUT', url, data);
		return data as T;
	},

	delete: async (url: string): Promise<void> => {
		await delay(300);
		console.log('DELETE', url);
	},
};
