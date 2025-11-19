import {
	createContext,
	useContext,
	useEffect,
	useState,
	ReactNode,
} from 'react';
import { supabase } from '@/shared/lib/supabaseClient';

type AuthUser = {
	id: string;
	email?: string;
	phone?: string;
};

type AuthContextValue = {
	user: AuthUser | null;
	loading: boolean;
	setManualUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue>({
	user: null,
	loading: true,
	setManualUser: () => undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
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

	const value: AuthContextValue = {
		user: manualUser ?? sessionUser,
		loading,
		setManualUser: handleSetManualUser,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	return useContext(AuthContext);
}
