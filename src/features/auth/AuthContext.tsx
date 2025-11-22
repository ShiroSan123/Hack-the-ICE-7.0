import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
	ReactNode,
} from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { profilesApi } from '@/shared/api/profilesApi';
import { useAppStore } from '@/shared/store/useAppStore';
import type { UserProfile } from '@/shared/types/user';

type AuthUser = {
	id: string;
	email?: string;
	phone?: string;
};

type AuthContextValue = {
	user: AuthUser | null;
	loading: boolean;
	profileSyncing: boolean;
	profileError: string | null;
	refreshProfile: () => Promise<void>;
	setManualUser: (user: AuthUser | null) => void;
};

const PROFILE_ERROR_MESSAGE = 'Не удалось загрузить профиль. Попробуйте снова.';
const DEFAULT_REGION = 'xxxxxxxxx';
const DEFAULT_CATEGORY = 'pensioner';
const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const buildFallbackProfile = (user: AuthUser): UserProfile => ({
	id: user.id,
	authUserId: user.id,
	name: user.email || user.phone || 'Пользователь',
	email: user.email ?? undefined,
	phone: user.phone ?? undefined,
	region: DEFAULT_REGION,
	category: DEFAULT_CATEGORY,
	role: 'self',
	interests: [],
	simpleModeEnabled: true,
});

const AuthContext = createContext<AuthContextValue>({
	user: null,
	loading: true,
	profileSyncing: false,
	profileError: null,
	refreshProfile: async () => undefined,
	setManualUser: () => undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
	const { user: profile, setUser } = useAppStore();
	const [sessionUser, setSessionUser] = useState<AuthUser | null>(null);
	const [manualUser, setManualUserState] = useState<AuthUser | null>(() => {
		if (typeof window === 'undefined') return null;
		const stored = window.localStorage.getItem('support-plus-manual-user');
		if (!stored) return null;
		try {
			return JSON.parse(stored) as AuthUser;
		} catch (_e) {
			return null;
		}
	});
	const [loading, setLoading] = useState(true);
	const [profileSyncing, setProfileSyncing] = useState(false);
	const [profileError, setProfileError] = useState<string | null>(null);
	const profileSyncUserRef = useRef<string | null>(null);
	const authUser = manualUser ?? sessionUser;
	const profileAuthUserId = profile?.authUserId;

	useEffect(() => {
		let isMounted = true;

		const init = async () => {
			try {
				// 1. пробуем получить юзера
				const { data, error } = await supabase.auth.getUser();

				if (!isMounted) return;

				// 2. если сессии нет — это нормальный кейс, просто user остаётся null
				if (error) {
					// Supabase кидает AuthSessionMissingError, когда вообще нет сессии
					if (error.name !== 'AuthSessionMissingError') {
						console.error('getUser unexpected error:', error);
					}
					return;
				}

				if (data.user) {
					setSessionUser({
						id: data.user.id,
						email: data.user.email ?? undefined,
						phone: data.user.phone ?? data.user.user_metadata?.phone ?? undefined,
					});
				}
			} finally {
				if (isMounted) setLoading(false);
			}
		};

		init();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			if (!isMounted) return;

			if (session?.user) {
				setSessionUser({
					id: session.user.id,
					email: session.user.email ?? undefined,
					phone: session.user.phone ?? session.user.user_metadata?.phone ?? undefined,
				});
			} else {
				setSessionUser(null);
			}
		});

		return () => {
			isMounted = false;
			subscription.unsubscribe();
		};
	}, []);

	useEffect(() => {
		if (sessionUser) {
			setManualUserState(null);
			if (typeof window !== 'undefined') {
				window.localStorage.removeItem('support-plus-manual-user');
			}
		}
	}, [sessionUser]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (manualUser) {
			window.localStorage.setItem(
				'support-plus-manual-user',
				JSON.stringify(manualUser)
			);
		} else {
			window.localStorage.removeItem('support-plus-manual-user');
		}
	}, [manualUser]);

	const handleSetManualUser = (value: AuthUser | null) => {
		setManualUserState(value);
	};

	const ensureProfileForUser = useCallback(
		async (current: AuthUser) => {
			if (!UUID_REGEX.test(current.id)) {
				return buildFallbackProfile(current);
			}

			return profilesApi.ensureProfile({
				authUserId: current.id,
				fullName: current.email || current.phone || 'Пользователь',
				email: current.email ?? null,
				phone: current.phone ?? null,
			});
		},
		[]
	);

	const refreshProfile = useCallback(async () => {
		if (!authUser) {
			setProfileError(null);
			return;
		}

		setProfileSyncing(true);
		setProfileError(null);
		profileSyncUserRef.current = authUser.id;

		try {
			const syncedProfile = await ensureProfileForUser(authUser);
			setUser(syncedProfile);
		} catch (error) {
			console.error('Failed to sync profile:', error);
			setProfileError(PROFILE_ERROR_MESSAGE);
			throw error;
		} finally {
			if (profileSyncUserRef.current === authUser.id) {
				profileSyncUserRef.current = null;
				setProfileSyncing(false);
			}
		}
	}, [authUser, ensureProfileForUser, setUser]);

	useEffect(() => {
		if (loading) {
			return;
		}

		if (!authUser) {
			setProfileSyncing(false);
			setProfileError(null);
			profileSyncUserRef.current = null;
			return;
		}

		if (
			profileAuthUserId === authUser.id ||
			profileSyncUserRef.current === authUser.id
		) {
			return;
		}

		let cancelled = false;

		const sync = async () => {
			setProfileSyncing(true);
			setProfileError(null);
			profileSyncUserRef.current = authUser.id;

			try {
				const syncedProfile = await ensureProfileForUser(authUser);
				if (!cancelled) {
					setUser(syncedProfile);
				}
			} catch (error) {
				if (cancelled) return;
				console.error('Failed to sync profile:', error);
				setProfileError(PROFILE_ERROR_MESSAGE);
			} finally {
				if (profileSyncUserRef.current === authUser.id) {
					profileSyncUserRef.current = null;
					setProfileSyncing(false);
				}
			}
		};

		sync();

		return () => {
			cancelled = true;
		};
	}, [authUser, ensureProfileForUser, loading, profileAuthUserId, setUser]);

	const value: AuthContextValue = {
		user: authUser,
		loading,
		profileSyncing,
		profileError,
		refreshProfile,
		setManualUser: handleSetManualUser,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	return useContext(AuthContext);
}
