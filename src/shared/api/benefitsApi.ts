import { supabase } from '@/shared/lib/supabaseClient';
import { calculateDaysUntil } from '@/shared/lib/formatters';
import { normalizeTargetGroup, normalizeTargetGroups } from '@/shared/lib/targetGroups';
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
	category_id?: string | null;
	tags?: string[] | null;
	merchant_name?: string | null;
	merchant_url?: string | null;
	locations?: unknown;
};

const mapRowToBenefit = (row: BenefitRow): Benefit => ({
	id: row.id,
	title: row.title,
	description: row.description,
	type: row.type as Benefit['type'],
	targetGroups: normalizeTargetGroups(row.target_groups),
	regions: row.regions ?? [],
	validFrom: row.valid_from ?? '',
	validTo: row.valid_to,
	requirements: row.requirements ?? [],
	steps: row.steps ?? [],
	documents: row.documents ?? [],
	partner: row.partner ?? undefined,
	savingsPerMonth: row.savings_per_month ?? undefined,
	isNew: Boolean(row.is_new),
	categoryId: row.category_id ?? undefined,
	tags: row.tags ?? [],
	merchantName: row.merchant_name ?? undefined,
	merchantUrl: row.merchant_url ?? undefined,
	locations: Array.isArray(row.locations) ? (row.locations as Benefit['locations']) : undefined,
	expiresIn: row.valid_to ? calculateDaysUntil(row.valid_to) : undefined,
});

const handleError = (error: unknown) => {
	if (error instanceof Error) {
		throw error;
	}
	throw new Error('Failed to load benefits');
};

type MatchBenefitsParams = {
	search?: string;
	region?: string | null;
	targetGroup?: string | null;
	tags?: string[];
	onlyNew?: boolean;
	type?: string;
	limit?: number;
	offset?: number;
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
		const normalizedTargetGroup = normalizeTargetGroup(profile?.category) ?? null;
		return benefitsApi.search({
			region: profile?.region ?? null,
			targetGroup: normalizedTargetGroup,
			limit: 500,
		});
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

	search: async (params: MatchBenefitsParams): Promise<Benefit[]> => {
		const { data, error } = await supabase.rpc('match_benefits', {
			p_search: params.search?.trim() || null,
			p_region: params.region ?? null,
			p_target_group: params.targetGroup ?? null,
			p_tags: params.tags && params.tags.length ? params.tags : null,
			p_only_new: params.onlyNew ?? false,
			p_type: params.type ?? null,
			p_limit: params.limit ?? 200,
			p_offset: params.offset ?? 0,
		});

		if (error || !data) handleError(error);
		return data.map((row) => mapRowToBenefit(row as BenefitRow));
	},
};
