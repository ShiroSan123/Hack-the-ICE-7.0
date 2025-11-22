import { supabase } from '@/shared/lib/supabaseClient';
import { calculateDaysUntil } from '@/shared/lib/formatters';
import { Benefit } from '../types';

type BenefitRow = {
	id: string;
	title: string;
	description: string;
	type: string;
	target_groups: string[];
	regions: string[];
	valid_from: string | null;
	valid_to: string | null;
	requirements: string[];
	documents: string[];
	steps: string[];
	partner: string | null;
	savings_per_month: number | null;
	is_new: boolean | null;
};

const mapRowToBenefit = (row: BenefitRow): Benefit => ({
	id: row.id,
	title: row.title,
	description: row.description,
	type: row.type as Benefit['type'],
	targetGroups: row.target_groups ?? [],
	regions: row.regions ?? [],
	validFrom: row.valid_from ?? '',
	validTo: row.valid_to,
	requirements: row.requirements ?? [],
	steps: row.steps ?? [],
	documents: row.documents ?? [],
	partner: row.partner ?? undefined,
	savingsPerMonth: row.savings_per_month ?? undefined,
	isNew: Boolean(row.is_new),
	expiresIn: row.valid_to ? calculateDaysUntil(row.valid_to) : undefined,
});

const handleError = (error: unknown) => {
	if (error instanceof Error) {
		throw error;
	}
	throw new Error('Failed to load benefits');
};

export const benefitsApi = {
	getAll: async (): Promise<Benefit[]> => {
		const { data, error } = await supabase
			.from('benefits')
			.select('*')
			.order('title');
		if (error || !data) handleError(error);
		return data.map((row) => mapRowToBenefit(row as BenefitRow));
	},

	getById: async (id: string): Promise<Benefit | undefined> => {
		const { data, error } = await supabase
			.from('benefits')
			.select('*')
			.eq('id', id)
			.maybeSingle();
		if (error) handleError(error);
		return data ? mapRowToBenefit(data as BenefitRow) : undefined;
	},

	filterByRegion: async (region: string): Promise<Benefit[]> => {
		const { data, error } = await supabase
			.from('benefits')
			.select('*')
			.contains('regions', [region]);
		if (error || !data) handleError(error);
		return data.map((row) => mapRowToBenefit(row as BenefitRow));
	},

	filterByTargetGroup: async (targetGroup: string): Promise<Benefit[]> => {
		const { data, error } = await supabase
			.from('benefits')
			.select('*')
			.contains('target_groups', [targetGroup]);
		if (error || !data) handleError(error);
		return data.map((row) => mapRowToBenefit(row as BenefitRow));
	},
};
