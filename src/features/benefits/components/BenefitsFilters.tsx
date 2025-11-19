import { Card, CardContent } from '@/shared/ui/Card';
import { cn } from '@/lib/utils';

interface FiltersProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	selectedType: string;
	onTypeChange: (type: string) => void;
}

export const BenefitsFilters = ({
	searchQuery,
	onSearchChange,
	selectedType,
	onTypeChange,
}: FiltersProps) => {
	const types = [
		{ value: 'all', label: 'Все' },
		{ value: 'social', label: 'Социальные' },
		{ value: 'medical', label: 'Медицинские' },
		{ value: 'transport', label: 'Транспорт' },
		{ value: 'housing', label: 'Жильё' },
		{ value: 'utility', label: 'ЖКХ' },
		{ value: 'tax', label: 'Налоги' },
		{ value: 'culture', label: 'Культура' },
	];

	return (
		<Card className="rounded-3xl border border-border/80 bg-white">
			<CardContent className="pt-6 space-y-6">
				<div>
					<p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-2">
						Найти льготу
					</p>
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder="Введите название или партнёра"
						className="w-full h-12 rounded-2xl border-2 border-input bg-background px-4 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					/>
				</div>

				<div className="space-y-3">
					<p className="text-base font-semibold">Тип льготы</p>
					<div className="flex flex-wrap gap-2">
						{types.map((type) => {
							const active = selectedType === type.value;
							return (
								<button
									key={type.value}
									type="button"
									onClick={() => onTypeChange(type.value)}
									className={cn(
										'rounded-2xl border px-4 py-2 text-sm font-semibold transition-all',
										active
											? 'border-primary bg-primary/10 text-primary shadow-sm'
											: 'border-border text-muted-foreground hover:border-primary/50'
									)}
								>
									{type.label}
								</button>
							);
						})}
					</div>
				</div>

				<p className="text-sm text-muted-foreground">
					Фильтруйте по типу или по названию. В карточке будет список документов и шагов, чтобы сразу перейти к действию.
				</p>
			</CardContent>
		</Card>
	);
};
