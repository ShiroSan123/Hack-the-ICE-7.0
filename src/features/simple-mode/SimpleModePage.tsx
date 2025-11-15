import { Button } from '@/shared/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useTTS } from '@/shared/lib/useTTS';
import { Heart, Lightbulb, Pill, Printer } from 'lucide-react';

export const SimpleModePage = () => {
	const navigate = useNavigate();
	const { speak } = useTTS();

	const buttons = [
		{
			label: 'Мои льготы',
			description: 'Посмотреть все доступные льготы',
			icon: Heart,
			to: '/dashboard',
			color: 'bg-primary hover:bg-primary/90',
		},
		{
			label: 'Подсказать',
			description: 'Найти нужную льготу',
			icon: Lightbulb,
			to: '/benefits',
			color: 'bg-accent hover:bg-accent/90',
		},
		{
			label: 'Аптечка',
			description: 'Мои лекарства и скидки',
			icon: Pill,
			to: '/apteka',
			color: 'bg-primary hover:bg-primary/90',
		},
		{
			label: 'Печать',
			description: 'Распечатать льготы',
			icon: Printer,
			to: '/print',
			color: 'bg-secondary hover:bg-secondary/80',
		},
	];

	const handleClick = (label: string, to: string) => {
		speak(label);
		setTimeout(() => navigate(to), 500);
	};

	return (
		<div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
			<div className="w-full max-w-4xl">
				<h1 className="text-4xl md:text-5xl font-bold text-center mb-12">
					Упрощённый режим
				</h1>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{buttons.map((button) => {
						const Icon = button.icon;
						return (
							<Button
								key={button.to}
								size="huge"
								onClick={() => handleClick(button.label, button.to)}
								className={`${button.color} text-primary-foreground shadow-2xl hover:shadow-xl transition-all duration-300 flex flex-col items-center gap-4 py-12 h-auto`}
							>
								<Icon className="w-16 h-16 md:w-20 md:h-20" />
								<div className="text-center">
									<div className="text-2xl md:text-3xl font-bold mb-2">
										{button.label}
									</div>
									<div className="text-lg md:text-xl font-normal opacity-90">
										{button.description}
									</div>
								</div>
							</Button>
						);
					})}
				</div>

				<div className="mt-12 text-center">
					<Button
						variant="outline"
						size="xl"
						onClick={() => navigate('/profile')}
						className="text-xl"
					>
						Настройки
					</Button>
				</div>
			</div>
		</div>
	);
};
