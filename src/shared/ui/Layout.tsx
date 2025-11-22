import { ReactNode, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
	LayoutDashboard,
	MessageCircle,
	Menu,
	Pill,
	FileText,
	User,
	Heart,
	X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '@/shared/lib/supabaseClient';
import { useAuth } from '@/features/auth/AuthContext';
import { cn } from '@/lib/utils';
import { ModeSwitch } from './ModeSwitch';

interface LayoutProps {
	children: ReactNode;
	title?: string;
}

export const Layout = ({ children, title }: LayoutProps) => {
	const [menuOpen, setMenuOpen] = useState(false);
	const { user, logout } = useAppStore();
	const { setManualUser } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	const handleLogout = async () => {
		try {
			await supabase.auth.signOut();
		} catch (error) {
			console.error('signOut error:', error);
		} finally {
			setManualUser(null);
			logout();
			navigate('/auth');
		}
	};

	const navigation = [
		{ name: 'Главная', to: '/dashboard', icon: LayoutDashboard, match: ['/dashboard'] },
		{ name: 'Льготы', to: '/benefits', icon: Heart, match: ['/benefits'] },
		{ name: 'Аптечка', to: '/apteka', icon: Pill, match: ['/apteka'] },
		{ name: 'Ассистент', to: '/assistant', icon: MessageCircle, match: ['/assistant'] },
		{ name: 'Профиль', to: '/profile', icon: User, match: ['/profile'] },
		{ name: 'Печать', to: '/print', icon: FileText, match: ['/print'] },
	];

	const categoryLabel = useMemo(() => {
		if (!user?.category) return null;
		const map: Record<string, string> = {
			pensioner: 'Пенсионер',
			disabled: 'Инвалид',
			veteran: 'Ветеран',
			'large-family': 'Многодетная семья',
			'low-income': 'Малоимущий',
		};
		return map[user.category] ?? user.category;
	}, [user?.category]);

	const isLinkActive = (match?: string[]) => {
		if (!match || match.length === 0) return false;
		return match.some((prefix) => location.pathname.startsWith(prefix));
	};

	return (
		<div className="min-h-screen min-h-dvh bg-slate-50 text-foreground flex flex-col">
			<header className="no-print sticky top-0 z-50 border-b border-border/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 safe-area-top">
				<div className="bg-gradient-to-r from-primary/15 via-accent/10 to-transparent border-b border-primary/20">
					<div className="app-shell py-2 text-sm text-primary flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
						<p className="font-semibold">Социальный навигатор для помощи льготникам</p>
						<div className="flex flex-wrap gap-4 text-primary/80">
							<span>Горячая линия: 122</span>
							<span>Регион: {user?.region || 'xxxxxxxxx'}</span>
							{categoryLabel && <span>Категория: {categoryLabel}</span>}
						</div>
					</div>
				</div>

				<div className="app-shell flex items-center gap-4 py-3">
					<Link to="/dashboard" className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
							<Heart className="w-6 h-6" />
						</div>
						<div>
							<p className="text-xl font-bold leading-tight">Поддержка++</p>
							<p className="text-sm text-muted-foreground">Льготы в один клик</p>
						</div>
					</Link>

					<nav className="hidden lg:flex items-center gap-2 flex-1">
						{navigation.map((item) => {
							const active = isLinkActive(item.match);
							return (
								<Link
									key={item.to}
									to={item.to}
									className={cn(
										'flex items-center gap-2 rounded-2xl px-4 py-2 text-base font-semibold transition-all',
										active
											? 'bg-primary/10 text-primary shadow-sm'
											: 'text-muted-foreground hover:text-primary hover:bg-primary/5'
									)}
								>
									<item.icon className="w-4 h-4" />
									{item.name}
								</Link>
							);
						})}
					</nav>

					<div className="hidden md:flex items-center gap-3">
						<ModeSwitch />
						{user && (
							<Button variant="outline" size="sm" onClick={handleLogout}>
								Выйти
							</Button>
						)}
					</div>

					<div className="ml-auto flex items-center gap-2 md:hidden">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setMenuOpen((prev) => !prev)}
							aria-label="Открыть меню"
						>
							{menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
						</Button>
					</div>
				</div>

				{menuOpen && (
					<div className="border-t border-border/80 bg-white md:hidden">
						<div className="app-shell py-4 space-y-4">
							<ModeSwitch className="w-full" />
							<nav className="flex flex-col gap-2">
								{navigation.map((item) => (
									<Link
										key={item.to}
										to={item.to}
										onClick={() => setMenuOpen(false)}
										className="flex items-center gap-3 rounded-2xl px-4 py-3 text-lg font-semibold text-foreground hover:bg-primary/5"
									>
										<item.icon className="w-5 h-5" />
										{item.name}
									</Link>
								))}
							</nav>
							{user && (
								<Button variant="outline" size="lg" className="w-full" onClick={handleLogout}>
									Выйти
								</Button>
							)}
						</div>
					</div>
				)}
			</header>

			<main className="app-shell flex-1 w-full py-8 md:py-10">
				{title && (
					<div className="mb-8 space-y-2">
						<p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Поддержка++</p>
						<h1 className="text-3xl md:text-4xl font-bold text-slate-900">{title}</h1>
					</div>
				)}
				{children}
			</main>

			<footer className="border-t border-border bg-white mt-12 no-print safe-area-bottom">
				<div className="app-shell py-8 grid gap-6 text-sm text-muted-foreground md:grid-cols-3">
					<div>
						<p className="font-semibold text-foreground">Поддержка++</p>
						<p className="mt-2">Цифровой помощник рассказывает, какие льготы, скидки и выплаты положены малозащищённым гражданам.</p>
					</div>
					<div>
						<p className="font-semibold text-foreground">Контакты</p>
						<p className="mt-2">Горячая линия: 122</p>
						<p>Справочная: +7 (800) 700-00-00</p>
					</div>
					<div>
						<p className="font-semibold text-foreground">Регион</p>
						<p className="mt-2">{user?.region || 'xxxxxxxxx'}</p>
						<p>© 2024 Социальный навигатор</p>
					</div>
				</div>
			</footer>
		</div>
	);
};
