import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MonitorSmartphone, HandHelping } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/shared/store/useAppStore';

type Mode = 'main' | 'simple';

interface ModeSwitchProps {
	className?: string;
}

export const ModeSwitch = ({ className }: ModeSwitchProps) => {
	const location = useLocation();
	const navigate = useNavigate();
	const { user, setSimpleMode } = useAppStore();

	const currentMode: Mode = useMemo<Mode>(() => {
		if (user?.simpleModeEnabled) return 'simple';
		return location.pathname.startsWith('/simple') ? 'simple' : 'main';
	}, [location.pathname, user?.simpleModeEnabled]);

	const handleSelect = (mode: Mode) => {
		if (mode === currentMode) return;

		if (mode === 'simple') {
			setSimpleMode(true);
			navigate('/benefits');
			return;
		}

		if (mode === 'main') {
			setSimpleMode(false);
			navigate('/dashboard');
		}
	};

	const buttonBase =
		'flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2';

	return (
		<div
			className={cn(
				'rounded-2xl border border-border/80 bg-white shadow-sm backdrop-blur-sm flex gap-1 p-1',
				className
			)}
			role="group"
			aria-label="Переключатель режима интерфейса"
		>
			<button
				type="button"
				className={cn(
					buttonBase,
					currentMode === 'main'
						? 'bg-primary text-primary-foreground shadow-md'
						: 'text-muted-foreground hover:text-primary hover:bg-primary/5'
				)}
				aria-pressed={currentMode === 'main'}
				onClick={() => handleSelect('main')}
			>
				<MonitorSmartphone className="w-4 h-4" />
				<span>Основной</span>
			</button>
			<button
				type="button"
				className={cn(
					buttonBase,
					currentMode === 'simple'
						? 'bg-accent text-accent-foreground shadow-md'
						: 'text-muted-foreground hover:text-accent hover:bg-accent/5'
				)}
				aria-pressed={currentMode === 'simple'}
				onClick={() => handleSelect('simple')}
				title="Перейти в упрощённый режим"
			>
				<HandHelping className="w-4 h-4" />
				<span>Простой</span>
			</button>
		</div>
	);
};
