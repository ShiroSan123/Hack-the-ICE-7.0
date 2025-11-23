import type { TargetGroup } from '@/shared/types/benefit';

const CANONICAL_GROUPS: TargetGroup[] = [
	'pensioner',
	'disabled',
	'veteran',
	'large-family',
	'low-income',
	'child',
	'russia',
];

const TARGET_GROUP_ALIASES: Record<string, TargetGroup> = {
	pensioner: 'pensioner',
	woman_55_plus: 'pensioner',
	man_60_plus: 'pensioner',

	disabled: 'disabled',
	invalid_group_1: 'disabled',
	invalid_group_2: 'disabled',
	invalid_child: 'disabled',
	disabled_child_family: 'disabled',
	federal_beneficiary: 'disabled',
	indigenous_small_peoples_north: 'disabled',

	veteran: 'veteran',

	'large-family': 'large-family',
	large_family: 'large-family',
	many_children_family: 'large-family',
	'family-with-children': 'large-family',
	family_with_children: 'large-family',
	family_with_child_under_6: 'large-family',
	family_with_child_under6: 'large-family',
	young_family: 'large-family',

	'low-income': 'low-income',
	low_income: 'low-income',
	dwfo_resident: 'low-income',
	teacher: 'low-income',
	doctor: 'low-income',

	child: 'child',
	child_0_3: 'child',
	child_0_6: 'child',
	child_0_17: 'child',
	youth_under_23: 'child',

	russia: 'russia',
};

export function normalizeTargetGroup(value?: string | null): TargetGroup | null {
	if (!value) return null;

	const direct = TARGET_GROUP_ALIASES[value];
	if (direct) {
		return direct;
	}

	const fallback = value.replace(/_/g, '-') as TargetGroup;
	if (CANONICAL_GROUPS.includes(fallback)) {
		return fallback;
	}

	return null;
}

export function normalizeTargetGroups(values: string[] = []): TargetGroup[] {
	const acc = new Set<TargetGroup>();

	for (const value of values) {
		const normalized = normalizeTargetGroup(value);
		if (normalized) {
			acc.add(normalized);
		}
	}

	return Array.from(acc);
}

export function isSameTargetGroup(a?: string | null, b?: string | null): boolean {
	const normA = normalizeTargetGroup(a);
	const normB = normalizeTargetGroup(b);
	return Boolean(normA && normB && normA === normB);
}

export const CANONICAL_TARGET_GROUPS = CANONICAL_GROUPS;
