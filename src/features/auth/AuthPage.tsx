import { useState } from 'react';
import { Button } from '@/shared/ui/Button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/shared/ui/Card';
import { Heart } from 'lucide-react';
import { OtpForm } from './components/OtpForm';
import { supabase } from '@/shared/lib/supabaseClient';

type Method = 'otp' | 'gosuslugi' | 'google';
const GOSUSLUGI_BLOCKED = true;

export const AuthPage = () => {
	const [isAuthOpen, setIsAuthOpen] = useState(false);
	const [method, setMethod] = useState<Method>('otp');

	const closeAuth = () => {
		setIsAuthOpen(false);
		setMethod('otp');
	};

	const toggleAuth = () => {
		setIsAuthOpen((prev) => {
			const next = !prev;
			if (!next) {
				setMethod('otp');
			}
			return next;
		});
	};

	const handleGoogle = async () => {
		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: 'google',
				options: {
					redirectTo: window.location.origin,
				},
			});
			if (error) console.error('OAuth error:', error);
		} catch (e) {
			console.error('Unexpected OAuth error:', e);
		}
	};

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
						onClick={toggleAuth}
					>
						{isAuthOpen ? 'Скрыть форму' : 'Войти / Зарегистрироваться'}
					</Button>
					{isAuthOpen && (
						<div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4 shadow-sm">
							<div className="flex gap-2">
								{(['otp', 'gosuslugi', 'google'] as Method[]).map((item) => (
									<button
										key={item}
										type="button"
										onClick={() => setMethod(item)}
										className={`flex-1 rounded-lg px-3 py-2 text-sm capitalize ${method === item
											? 'bg-black text-white'
											: 'bg-white text-gray-700'
											}`}
									>
										{item === 'otp'
											? 'Телефон / почта'
											: item === 'gosuslugi'
												? GOSUSLUGI_BLOCKED
													? 'Госуслуги (недоступно)'
													: 'Госуслуги'
												: 'Google'}
									</button>
								))}
							</div>

							{method === 'otp' && <OtpForm onSuccess={closeAuth} />}

							{method === 'gosuslugi' && (
								<div className="space-y-2 rounded-lg border border-red-200 bg-red-50/60 p-3 text-center">
									<p className="text-sm font-medium text-red-600">
										Вход через Госуслуги временно заблокирован
									</p>
									<p className="text-xs text-gray-600">
										Пожалуйста, используйте вход по телефону / почте или через
										Google. Мы уведомим, когда доступ вернётся.
									</p>
								</div>
							)}

							{method === 'google' && (
								<div className="space-y-3">
									<p className="text-sm text-gray-600">
										Вход через аккаунт Google.
									</p>
									<button
										onClick={handleGoogle}
										className="w-full flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
									>
										<span className="text-lg">G</span>
										<span>Войти через Google</span>
									</button>
								</div>
							)}

							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="w-full text-sm"
								onClick={closeAuth}
							>
								Отменить
							</Button>
						</div>
					)}
					<p className="text-center text-sm text-muted-foreground">
						При первом входе будет создан новый профиль
					</p>
				</CardContent>
			</Card>
		</div>
	);
};
