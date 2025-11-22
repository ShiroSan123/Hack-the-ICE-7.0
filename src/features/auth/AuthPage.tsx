import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/Button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/shared/ui/Card';
import { useAppStore } from '@/shared/store/useAppStore';
import { Heart, Loader2 } from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './AuthContext';
import { profilesApi } from '@/shared/api/profilesApi';

export const AuthPage = () => {
	const { user: authUser, loading: authLoading } = useAuth();
	const { setUser } = useAppStore();
	const navigate = useNavigate();
	const [isAuthOpen, setIsAuthOpen] = useState(false);
	const [syncingProfile, setSyncingProfile] = useState(false);
	const [syncError, setSyncError] = useState<string | null>(null);

	useEffect(() => {
		if (authLoading || !authUser) return;
		let active = true;
		setSyncingProfile(true);
		setSyncError(null);

		profilesApi
			.ensureProfile({
				authUserId: authUser.id,
				fullName: authUser.email || authUser.phone || 'Пользователь',
				email: authUser.email ?? null,
				phone: authUser.phone ?? null,
			})
			.then((profile) => {
				if (!active) return;
				setUser(profile);
				navigate('/dashboard', { replace: true });
			})
			.catch((error) => {
				if (!active) return;
				console.error('Failed to sync profile:', error);
				setSyncError('Не удалось загрузить профиль. Попробуйте снова.');
			})
			.finally(() => {
				if (active) setSyncingProfile(false);
			});

		return () => {
			active = false;
		};
	}, [authUser, authLoading, navigate, setUser]);

	if (authLoading || syncingProfile) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="flex flex-col items-center gap-4 text-center">
					<Loader2 className="w-10 h-10 animate-spin text-primary" />
					<p className="text-lg font-medium">Загружаем профиль...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4">
						<Heart className="w-10 h-10 text-primary-foreground" />
					</div>
					<CardTitle className="text-3xl">Добро пожаловать</CardTitle>
					<CardDescription className="text-lg">
						Социальный навигатор «Поддержка++»
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-4">
					<Button
						type="button"
						size="lg"
						className="w-full"
						onClick={() => setIsAuthOpen(true)}
					>
						Войти / Зарегистрироваться
					</Button>

					{syncError && (
						<p className="text-sm text-destructive text-center">{syncError}</p>
					)}

					<p className="text-center text-sm text-muted-foreground">
						При первом входе будет создан новый профиль
					</p>
				</CardContent>
			</Card>

			{isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} />}
		</div>
	);
};
