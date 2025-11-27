import { Button } from '@/shared/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useTTS } from '@/shared/lib/useTTS';
import { Heart, Lightbulb, Pill, Printer, MessageCircle } from 'lucide-react';
import { ModeSwitch } from '@/shared/ui/ModeSwitch';

export const SimpleModePage = () => {
	const navigate = useNavigate();
	const { speak, available: ttsAvailable } = useTTS();

	const buttons = [
		{
			label: 'Мои льготы',
			description: 'Посмотреть все доступные льготы',
			icon: Heart,
			to: '/dashboard',
			color: 'bg-primary text-white hover:bg-primary/90',
		},
		{
			label: 'Подсказать',
			description: 'Найти нужную льготу',
			icon: Lightbulb,
			to: '/benefits',
			color: 'bg-accent text-white hover:bg-accent/90',
		},
		{
			label: 'Аптечка',
			description: 'Мои лекарства и скидки',
			icon: Pill,
			to: '/apteka',
			color: 'bg-primary text-white hover:bg-primary/90',
		},
		{
			label: 'Печать',
			description: 'Распечатать льготы',
			icon: Printer,
			to: '/print',
			color: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
		},
		{
			label: 'Ассистент',
			description: 'Спросить в чат-боте',
			icon: MessageCircle,
			to: '/assistant',
			color: 'bg-primary text-white hover:bg-primary/90',
		},
	];

	const handleClick = (label: string, to: string) => {
		if (ttsAvailable) {
			speak(label);
			setTimeout(() => navigate(to), 500);
			return;
		}
		navigate(to);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex flex-col safe-area-top safe-area-bottom pb-24">
			<div className="app-shell w-full max-w-5xl space-y-8 py-6">
				<div className="flex flex-col gap-4 rounded-3xl bg-white/80 p-6 shadow-sm">
					<ModeSwitch />
					<div className="text-center space-y-2">
						<h1 className="text-4xl font-bold">Простой режим</h1>
						<p className="text-lg text-muted-foreground">
							Крупные кнопки, голосовые команды и быстрый доступ к главным действиям.
						</p>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{buttons.map((button) => {
						const Icon = button.icon;
						return (
							<Button
								key={button.to}
								size="huge"
								onClick={() => handleClick(button.label, button.to)}
								className={`${button.color} shadow-2xl hover:shadow-xl transition-all duration-300 flex flex-col items-center gap-4 py-12 h-auto`}
							>
								<Icon className="w-16 h-16 md:w-20 md:h-20" />
								<div className="text-center">
									<div className="text-2xl md:text-3xl font-bold mb-2">
										{button.label}
									</div>
									<div className="text-lg md:text-xl opacity-90">
										{button.description}
									</div>
								</div>
							</Button>
						);
					})}
				</div>

				<div className="mt-8 grid gap-4 md:grid-cols-2">
					<Button
						variant="outline"
						size="xl"
						onClick={() => navigate('/profile')}
						className="h-auto flex flex-col gap-2 py-6"
					>
						<span className="text-2xl font-bold">Настройки профиля</span>
						<span className="text-lg text-muted-foreground">Изменить данные и отключить простой режим</span>
					</Button>
					<Button
						variant="outline"
						size="xl"
						onClick={() => navigate('/print')}
						className="h-auto flex flex-col gap-2 py-6"
					>
						<span className="text-2xl font-bold">Печать памятки</span>
						<span className="text-lg text-muted-foreground">Список льгот и лекарств на бумаге</span>
					</Button>
				</div>
			</div>

			<div className="no-print fixed inset-x-0 bottom-0 z-40 bg-white/90 backdrop-blur border-t border-border/70 safe-area-bottom">
				<div className="app-shell max-w-4xl mx-auto py-3 grid grid-cols-3 gap-2 text-sm font-semibold">
					<Button variant="ghost" size="xl" onClick={() => handleClick('Главная', '/dashboard')} className="flex flex-col gap-1 h-auto py-3">
						<span>Главная</span>
						<span className="text-muted-foreground text-xs">к льготам</span>
					</Button>
					<Button variant="accent" size="xl" onClick={() => handleClick('Ассистент', '/assistant')} className="flex flex-col gap-1 h-auto py-3">
						<span>Ассистент</span>
						<span className="text-muted-foreground text-xs text-accent-foreground/90">быстрый вопрос</span>
					</Button>
					<Button variant="outline" size="xl" onClick={() => handleClick('Печать', '/print')} className="flex flex-col gap-1 h-auto py-3">
						<span>Печать</span>
						<span className="text-muted-foreground text-xs">памятка</span>
					</Button>
				</div>
			</div>
		</div>
	);
};
