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
};
