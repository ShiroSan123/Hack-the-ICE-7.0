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
};

type AuthContextValue = {
	user: AuthUser | null;
	loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
	user: null,
	loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
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
					setUser({
						id: data.user.id,
						email: data.user.email ?? undefined,
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
				setUser({
					id: session.user.id,
					email: session.user.email ?? undefined,
				});
			} else {
				setUser(null);
			}
		});

		return () => {
			isMounted = false;
			subscription.unsubscribe();
		};
	}, []);

	const value: AuthContextValue = {
		user,
		loading,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	return useContext(AuthContext);
}
