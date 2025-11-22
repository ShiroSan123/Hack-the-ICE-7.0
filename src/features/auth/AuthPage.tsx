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
import { AuthModal } from './components/AuthModal';

export const AuthPage = () => {
	const [isAuthOpen, setIsAuthOpen] = useState(false);

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
					<p className="text-center text-sm text-muted-foreground">
						При первом входе будет создан новый профиль
					</p>
				</CardContent>
			</Card>

			{isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} />}
		</div>
	);
};
