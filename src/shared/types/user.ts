import { TargetGroup } from './benefit';

export type UserRole = 'self' | 'relative';

export interface UserProfile {
	id: string;
	authUserId: string;
	phone?: string;
	email?: string;
	region: string;
	category: TargetGroup;
	snils?: string;
	interests: string[];
	role: UserRole;
	simpleModeEnabled?: boolean;
	name?: string;
	birthYear?: number;
	employmentStatus?: string;
	student?: boolean;
	pensioner?: boolean;
	veteran?: boolean;
	hasChildren?: boolean;
	disabilityGroup?: string;
	incomeBand?: string;
	city?: string;
}
