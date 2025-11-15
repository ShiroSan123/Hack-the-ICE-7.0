import { TargetGroup } from './benefit';

export interface Offer {
	id: string;
	title: string;
	description: string;
	partner: string;
	discount: number;
	validFrom: string;
	validTo: string;
	targetGroups: TargetGroup[];
	regions: string[];
	category: string;
	imageUrl?: string;
}
