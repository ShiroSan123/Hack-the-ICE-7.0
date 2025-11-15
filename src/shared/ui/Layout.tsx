import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Home, User, Heart, Pill, Grid3X3, FileText } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

interface LayoutProps {
	children: ReactNode;
	title?: string;
}

export const Layout = ({ children, title }: LayoutProps) => {
	const [menuOpen, setMenuOpen] = useState(false);
	const { user, logout } = useAppStore();
	const navigate = useNavigate();

	const handleLogout = () => {
		logout();
		navigate('/auth');
	};

	const navigation = [
		{ name: 'Главная', to: '/dashboard', icon: Home },
		{ name: 'Льготы', to: '/benefits', icon: Heart },
		{ name: 'Аптечка', to: '/apteka', icon: Pill },
		{ name: 'Профиль', to: '/profile', icon: User },
	];

	if (user?.simpleModeEnabled) {
		navigation.push({ name: 'Простой режим', to: '/simple', icon: Grid3X3 });
	}

	return (
		<div className="min-h-screen bg-background">
			<header className="sticky top-0 z-50 w-full border-b-2 border-border bg-card shadow-md no-print">
				<div className="container mx-auto flex h-16 md:h-20 items-center justify-between px-4">
					<Link to="/dashboard" className="flex items-center gap-3">
						<div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary flex items-center justify-center">
							<Heart className="w-6 h-6 md:w-7 md:h-7 text-primary-foreground" />
						</div>
						<span className="text-xl md:text-2xl font-bold text-foreground">Поддержка++</span>
					</Link>

					<nav className="hidden md:flex items-center gap-2">
						{navigation.map((item) => (
							<Button
								key={item.to}
								variant="ghost"
								size="default"
								asChild
							>
								<Link to={item.to} className="flex items-center gap-2">
									<item.icon className="w-5 h-5" />
									{item.name}
								</Link>
							</Button>
						))}
						{user && (
							<Button variant="outline" size="default" onClick={handleLogout}>
								Выйти
							</Button>
						)}
					</nav>

					<Button
						variant="ghost"
						size="icon"
						className="md:hidden"
						onClick={() => setMenuOpen(!menuOpen)}
						aria-label="Меню"
					>
						{menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
					</Button>
				</div>

				{menuOpen && (
					<div className="md:hidden border-t-2 border-border bg-card">
						<nav className="container mx-auto flex flex-col gap-2 p-4">
							{navigation.map((item) => (
								<Button
									key={item.to}
									variant="ghost"
									size="lg"
									asChild
									onClick={() => setMenuOpen(false)}
								>
									<Link to={item.to} className="flex items-center gap-3 justify-start">
										<item.icon className="w-6 h-6" />
										{item.name}
									</Link>
								</Button>
							))}
							{user && (
								<Button variant="outline" size="lg" onClick={handleLogout}>
									Выйти
								</Button>
							)}
						</nav>
					</div>
				)}
			</header>

			<main className="container mx-auto px-4 py-6 md:py-8">
				{title && (
					<h1 className="mb-6 md:mb-8 text-3xl md:text-4xl font-bold text-foreground">
						{title}
					</h1>
				)}
				{children}
			</main>

			<footer className="border-t-2 border-border bg-card mt-12 no-print">
				<div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
					<p className="text-base">© 2024 Поддержка++. Социальный навигатор для граждан.</p>
					<p className="text-sm mt-2">Регион: {user?.region || 'xxxxxxxxx'}</p>
				</div>
			</footer>
		</div>
	);
};
