import { supabase } from '@/shared/lib/supabaseClient';

export type UserMedicinesRecord = {
	userId: string;
	medicineIds: string[];
	publicIds: string[];
};

const mapRow = (row: any): UserMedicinesRecord => ({
	userId: row.user_id as string,
	medicineIds: (row.medicine_ids as string[]) ?? [],
	publicIds: (row.public_ids as string[]) ?? [],
});

export const userMedicinesApi = {
	async getForUser(userId: string): Promise<UserMedicinesRecord> {
		const { data, error } = await supabase
			.from('user_medicines')
			.select('*')
			.eq('user_id', userId)
			.single();

		if (error && error.code !== 'PGRST116') {
			// PGRST116 — no rows
			throw error;
		}

		if (!data) {
			return { userId, medicineIds: [], publicIds: [] };
		}

		return mapRow(data);
	},

	async upsert(record: UserMedicinesRecord): Promise<UserMedicinesRecord> {
		const payload = {
			user_id: record.userId,
			medicine_ids: record.medicineIds,
			public_ids: record.publicIds,
			updated_at: new Date().toISOString(),
		};

		const { data, error } = await supabase
			.from('user_medicines')
			.upsert(payload)
			.select('*')
			.single();

		if (error || !data) {
			throw error ?? new Error('Failed to upsert user medicines');
		}

		return mapRow(data);
	},
};
