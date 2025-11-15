import { Card, CardContent } from '@/shared/ui/Card';

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
		<Card>
			<CardContent className="pt-6 space-y-4">
				<div>
					<label className="block text-base font-medium mb-2">
						Поиск по названию
					</label>
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder="Введите название льготы..."
						className="w-full h-12 px-4 text-base rounded-lg border-2 border-input bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					/>
				</div>

				<div>
					<label className="block text-base font-medium mb-2">
						Тип льготы
					</label>
					<select
						value={selectedType}
						onChange={(e) => onTypeChange(e.target.value)}
						className="w-full h-12 px-4 text-base rounded-lg border-2 border-input bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					>
						{types.map((type) => (
							<option key={type.value} value={type.value}>
								{type.label}
							</option>
						))}
					</select>
				</div>
			</CardContent>
		</Card>
	);
};
