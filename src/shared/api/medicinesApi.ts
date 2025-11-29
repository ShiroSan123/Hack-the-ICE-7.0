import { supabase } from '@/shared/lib/supabaseClient';
import { Medicine } from '../types';

type MedicineRow = {
	id: string;
	name: string;
	dosage: string | null;
	frequency: string | null;
	prescribed_by: string | null;
	prescribed_date: string | null;
	refill_date: string | null;
	related_benefit_ids: string[];
	related_offer_ids: string[];
	monthly_price: number | null;
	discounted_price: number | null;
};

const mapRowToMedicine = (row: MedicineRow): Medicine => ({
	id: row.id,
	name: row.name,
	dosage: row.dosage ?? '',
	frequency: row.frequency ?? '',
	prescribedBy: row.prescribed_by ?? undefined,
	prescribedDate: row.prescribed_date ?? undefined,
	refillDate: row.refill_date ?? undefined,
	relatedBenefitIds: row.related_benefit_ids ?? [],
	relatedOfferIds: row.related_offer_ids ?? [],
	monthlyPrice: row.monthly_price ?? 0,
	discountedPrice: row.discounted_price ?? undefined,
});

type CreateMedicinePayload = {
	id?: string;
	name: string;
	dosage?: string;
	frequency?: string;
	prescribedBy?: string;
	prescribedDate?: string | null;
	refillDate?: string | null;
	monthlyPrice?: number | null;
	discountedPrice?: number | null;
	relatedBenefitIds?: string[];
	relatedOfferIds?: string[];
};

const createId = () => {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID();
	}
	return `med-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const medicinesApi = {
	getAll: async (): Promise<Medicine[]> => {
		const { data, error } = await supabase
			.from('medicines')
			.select('*')
			.order('name');
		if (error || !data) {
			throw error ?? new Error('Failed to load medicines');
		}
		return data.map((row) => mapRowToMedicine(row as MedicineRow));
	},

	create: async (payload: CreateMedicinePayload): Promise<Medicine> => {
		const id = payload.id ?? createId();
		const insertPayload = {
			id,
			name: payload.name,
			dosage: payload.dosage ?? null,
			frequency: payload.frequency ?? null,
			prescribed_by: payload.prescribedBy ?? null,
			prescribed_date: payload.prescribedDate ?? null,
			refill_date: payload.refillDate ?? null,
			related_benefit_ids: payload.relatedBenefitIds ?? [],
			related_offer_ids: payload.relatedOfferIds ?? [],
			monthly_price: typeof payload.monthlyPrice === 'number' ? payload.monthlyPrice : null,
			discounted_price: typeof payload.discountedPrice === 'number' ? payload.discountedPrice : null,
		};

		const { data, error } = await supabase
			.from('medicines')
			.insert(insertPayload)
			.select('*')
			.single();

		if (error || !data) {
			throw error ?? new Error('Failed to create medicine');
		}

		return mapRowToMedicine(data as MedicineRow);
	},

	getByIds: async (ids: string[]): Promise<Medicine[]> => {
		if (!ids.length) return [];

		const { data, error } = await supabase
			.from('medicines')
			.select('*')
			.in('id', ids);

		if (error || !data) {
			throw error ?? new Error('Failed to load medicines by ids');
		}

		return (data as MedicineRow[]).map(mapRowToMedicine);
	},
};
