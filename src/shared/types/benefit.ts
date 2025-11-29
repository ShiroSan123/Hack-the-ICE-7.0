export type BenefitType =
	| 'social'
	| 'medical'
	| 'transport'
	| 'housing'
	| 'utility'
	| 'tax'
	| 'education'
	| 'culture';

export type TargetGroup =
	| 'pensioner'
	| 'disabled'
	| 'veteran'
	| 'large-family'
	| 'low-income'
	| 'child'
	| 'russia';

export interface Benefit {
	id: string;
	title: string;
	description: string;
	type: BenefitType;
	targetGroups: TargetGroup[];
	regions: string[];
	validFrom: string;
	validTo: string | null;
	requirements: string[];
	steps: string[];
	documents: string[];
	partner?: string;
	categoryId?: string;
	tags?: string[];
	merchantName?: string;
	merchantUrl?: string;
	locations?: Array<{
		city?: string;
		address?: string;
		lat?: number;
		lon?: number;
	}>;
	amount?: number;
	savingsPerMonth?: number;
	isNew?: boolean;
	expiresIn?: number; // days
}
