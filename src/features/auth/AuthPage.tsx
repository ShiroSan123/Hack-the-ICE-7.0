import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card';
import { useAppStore } from '@/shared/store/useAppStore';
import { Heart } from 'lucide-react';

export const AuthPage = () => {
	const [phone, setPhone] = useState('');
	const [loading, setLoading] = useState(false);
	const { setUser } = useAppStore();
	const navigate = useNavigate();

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		// Mock login
		setTimeout(() => {
			setUser({
				id: 'user-1',
				phone,
				region: 'xxxxxxxxx',
				category: 'pensioner',
				interests: [],
				role: 'self',
				simpleModeEnabled: true,
				name: 'Пользователь',
			});
			setLoading(false);
			navigate('/dashboard');
		}, 500);
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
				<CardContent>
					<form onSubmit={handleLogin} className="space-y-6">
						<div>
							<label htmlFor="phone" className="block text-lg font-medium mb-2">
								Телефон или Email
							</label>
							<input
								id="phone"
								type="text"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="+7 (___) ___-__-__"
								className="w-full h-14 px-4 text-lg rounded-lg border-2 border-input bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
								required
							/>
						</div>

						<Button
							type="submit"
							size="lg"
							className="w-full"
							disabled={loading || !phone}
						>
							{loading ? 'Вход...' : 'Войти'}
						</Button>

						<p className="text-center text-sm text-muted-foreground">
							При первом входе будет создан новый профиль
						</p>
					</form>
				</CardContent>
			</Card>
		</div>
	);
};
