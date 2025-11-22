import { TargetGroup } from '@/shared/types/benefit';
import { UserProfile, UserRole } from '@/shared/types/user';
import { OTP_API_URL } from './otpClient';

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
	email?: string | null;
	region?: string;
	category?: TargetGroup;
	snils?: string | null;
	role?: UserRole;
	interests?: string[];
	simpleModeEnabled?: boolean;
	phone?: string | null;
};

const DEFAULT_REGION = 'xxxxxxxxx';
const DEFAULT_CATEGORY: TargetGroup = 'pensioner';

const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

		// защита от любых non-UUID
		if (!UUID_REGEX.test(authUserId)) {
			throw new Error(`ensureProfile: authUserId is not a valid UUID: ${authUserId}`);
		}

		const { profile } = await requestProfileApi<{ profile: ProfileRow }>(
			'/profiles/ensure',
			{
				method: 'POST',
				body: JSON.stringify({
					authUserId,
					fullName,
					email,
					phone,
				}),
			}
		);

		return mapRowToUserProfile(profile);
	},

	async updateProfile(
		authUserId: string,
		payload: UpdateProfilePayload
	): Promise<UserProfile> {
		if (!UUID_REGEX.test(authUserId)) {
			throw new Error(`updateProfile: authUserId is not valid UUID: ${authUserId}`);
		}

		const { profile } = await requestProfileApi<{ profile: ProfileRow }>(
			`/profiles/${authUserId}`,
			{
				method: 'PUT',
				body: JSON.stringify(payload),
			}
		);

		return mapRowToUserProfile(profile);
	},

	async deleteProfile(authUserId: string): Promise<void> {
		if (!UUID_REGEX.test(authUserId)) {
			throw new Error(`deleteProfile: authUserId is not valid UUID: ${authUserId}`);
		}

		await requestProfileApi(`/profiles/${authUserId}`, {
			method: 'DELETE',
		});
	},
};

async function requestProfileApi<T>(path: string, init: RequestInit): Promise<T> {
	const response = await fetch(`${OTP_API_URL}${path}`, {
		...init,
		headers: {
			'Content-Type': 'application/json',
			...(init.headers || {}),
		},
	});

	const text = await response.text();
	const payload = text ? (JSON.parse(text) as unknown) : null;

	if (!response.ok) {
		const message =
			payload && typeof payload === 'object' && 'message' in payload
				? (payload as { message?: string }).message
				: 'Не удалось выполнить запрос профиля';
		throw new Error(message || 'Не удалось выполнить запрос профиля');
	}

	return payload as T;
}
