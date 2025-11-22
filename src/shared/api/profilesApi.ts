import { supabase } from '@/shared/lib/supabaseClient';
import { TargetGroup } from '@/shared/types/benefit';
import { UserProfile, UserRole } from '@/shared/types/user';

interface ProfileRow {
	id: string;
	auth_user_id: string;
	full_name: string | null;
	email: string | null;
	phone: string | null;
	region: string | null;
	category: TargetGroup | null;
	snils: string | null;
	role: UserRole | null;
	interests: string[] | null;
	simple_mode_enabled: boolean | null;
}

export type UpsertProfilePayload = {
	authUserId: string;
	fullName?: string | null;
	email?: string | null;
	phone?: string | null;
};

export type UpdateProfilePayload = {
	fullName?: string | null;
	region?: string;
	category?: TargetGroup;
	snils?: string | null;
	role?: UserRole;
	interests?: string[];
	simpleModeEnabled?: boolean;
};

const DEFAULT_REGION = 'xxxxxxxxx';
const DEFAULT_CATEGORY: TargetGroup = 'pensioner';

const mapRowToUserProfile = (row: ProfileRow): UserProfile => ({
	id: row.id,
	authUserId: row.auth_user_id,
	name: row.full_name ?? undefined,
	email: row.email ?? undefined,
	phone: row.phone ?? undefined,
	region: row.region ?? DEFAULT_REGION,
	category: row.category ?? DEFAULT_CATEGORY,
	snils: row.snils ?? undefined,
	role: row.role ?? 'self',
	interests: row.interests ?? [],
	simpleModeEnabled: row.simple_mode_enabled ?? true,
});

export const profilesApi = {
	async ensureProfile(payload: UpsertProfilePayload): Promise<UserProfile> {
		const { authUserId, fullName, email, phone } = payload;
		const { data, error } = await supabase
			.from('profiles')
			.select('*')
			.eq('auth_user_id', authUserId)
			.maybeSingle();

		if (error) {
			throw error;
		}

		if (data) {
			return mapRowToUserProfile(data as ProfileRow);
		}

		const insertPayload = {
			auth_user_id: authUserId,
			full_name: fullName ?? 'Пользователь',
			email: email ?? null,
			phone: phone ?? null,
			region: DEFAULT_REGION,
			category: DEFAULT_CATEGORY,
			role: 'self' as UserRole,
			interests: [],
			simple_mode_enabled: true,
		};

		const { data: created, error: insertError } = await supabase
			.from('profiles')
			.insert(insertPayload)
			.select('*')
			.single();

		if (insertError || !created) {
			throw insertError;
		}

		return mapRowToUserProfile(created as ProfileRow);
	},

	async updateProfile(id: string, payload: UpdateProfilePayload): Promise<UserProfile> {
		const updatePayload: Record<string, unknown> = {};

		if ('fullName' in payload) updatePayload.full_name = payload.fullName ?? null;
		if ('region' in payload) updatePayload.region = payload.region;
		if ('category' in payload) updatePayload.category = payload.category;
		if ('snils' in payload) updatePayload.snils = payload.snils ?? null;
		if ('role' in payload) updatePayload.role = payload.role;
		if ('interests' in payload) updatePayload.interests = payload.interests;
		if ('simpleModeEnabled' in payload)
			updatePayload.simple_mode_enabled = payload.simpleModeEnabled;

		const { data, error } = await supabase
			.from('profiles')
			.update(updatePayload)
			.eq('id', id)
			.select('*')
			.single();

		if (error || !data) {
			throw error;
		}

		return mapRowToUserProfile(data as ProfileRow);
	},

	async deleteProfile(id: string): Promise<void> {
		const { error } = await supabase.from('profiles').delete().eq('id', id);
		if (error) {
			throw error;
		}
	},
};
