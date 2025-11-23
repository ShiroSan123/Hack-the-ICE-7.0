import { supabase } from '@/shared/lib/supabaseClient';
import { normalizeTargetGroups } from '@/shared/lib/targetGroups';
import { Offer } from '../types/offer';

type OfferRow = {
	id: string;
	title: string;
	description: string;
	partner: string | null;
	discount: number | null;
	valid_from: string | null;
	valid_to: string | null;
	target_groups: string[];
	regions: string[];
	category: string | null;
};

const mapRowToOffer = (row: OfferRow): Offer => ({
	id: row.id,
	title: row.title,
	description: row.description,
	partner: row.partner ?? '',
	discount: row.discount ?? 0,
	validFrom: row.valid_from ?? '',
	validTo: row.valid_to ?? '',
	targetGroups: normalizeTargetGroups(row.target_groups),
	regions: row.regions ?? [],
	category: row.category ?? '',
});

const handleError = (error: unknown) => {
	if (error instanceof Error) throw error;
	throw new Error('Failed to load offers');
};

export const offersApi = {
	getAll: async (): Promise<Offer[]> => {
		const { data, error } = await supabase
			.from('offers')
			.select('*')
			.order('title');
		if (error || !data) handleError(error);
		return data.map((row) => mapRowToOffer(row as OfferRow));
	},

	getById: async (id: string): Promise<Offer | undefined> => {
		const { data, error } = await supabase
			.from('offers')
			.select('*')
			.eq('id', id)
			.maybeSingle();
		if (error) handleError(error);
		return data ? mapRowToOffer(data as OfferRow) : undefined;
	},

	filterByRegion: async (region: string): Promise<Offer[]> => {
		const { data, error } = await supabase
			.from('offers')
			.select('*')
			.contains('regions', [region]);
		if (error || !data) handleError(error);
		return data.map((row) => mapRowToOffer(row as OfferRow));
	},
};
