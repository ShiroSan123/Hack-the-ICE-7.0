import { supabase } from '@/shared/lib/supabaseClient';
import { calculateDaysUntil } from '@/shared/lib/formatters';
import { Benefit, UserProfile } from '../types';

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

const buildProfileQuery = (profile?: UserProfile | null) => {
	let query = supabase.from('benefits').select('*').order('title');
	if (!profile) {
		return query;
	}

	const regionFilter = profile.region || 'all';
	query = query.contains('target_groups', [profile.category]);
	query = query.or(`regions.cs.{${regionFilter}},regions.cs.{all}`);
	return query;
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

	getForProfile: async (profile?: UserProfile | null): Promise<Benefit[]> => {
		const query = buildProfileQuery(profile);
		const { data, error } = await query;
		if (error || !data) handleError(error);
		return data.map((row) => mapRowToBenefit(row as BenefitRow));
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
