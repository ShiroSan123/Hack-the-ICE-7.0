import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Benefit } from '@/shared/types';
import { formatDate, formatCurrency } from '@/shared/lib/formatters';
import { Link } from 'react-router-dom';
import { Volume2, AlertCircle, Sparkles } from 'lucide-react';
import { useTTS } from '@/shared/lib/useTTS';

interface BenefitCardProps {
	benefit: Benefit;
}

export const BenefitCard = ({ benefit }: BenefitCardProps) => {
	const { speak, speaking } = useTTS();

	const getBenefitTypeLabel = (type: string) => {
		const types: Record<string, string> = {
			social: 'Социальная',
			medical: 'Медицинская',
			transport: 'Транспорт',
			housing: 'Жильё',
			utility: 'ЖКХ',
			tax: 'Налоги',
			education: 'Образование',
			culture: 'Культура',
		};
		return types[type] || type;
	};

	const handleSpeak = () => {
		const text = `${benefit.title}. ${benefit.description}`;
		speak(text);
	};

	return (
		<Card className={benefit.isNew ? 'border-accent' : ''}>
			<CardHeader>
				<div className="flex items-start justify-between gap-2">
					<CardTitle className="flex-1">{benefit.title}</CardTitle>
					{benefit.isNew && (
						<div className="flex items-center gap-1 px-2 py-1 bg-accent text-accent-foreground rounded-md text-sm font-medium">
							<Sparkles className="w-4 h-4" />
							Новое
						</div>
					)}
				</div>
				<div className="flex flex-wrap gap-2 mt-2">
					<span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
						{getBenefitTypeLabel(benefit.type)}
					</span>
					{benefit.savingsPerMonth && (
						<span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">
							Экономия: {formatCurrency(benefit.savingsPerMonth)}/мес
						</span>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<CardDescription>{benefit.description}</CardDescription>

				{benefit.expiresIn && benefit.expiresIn < 90 && (
					<div className="flex items-center gap-2 mt-4 p-3 bg-destructive/10 text-destructive rounded-lg">
						<AlertCircle className="w-5 h-5 flex-shrink-0" />
						<span className="text-sm font-medium">
							Истекает через {benefit.expiresIn} дней
						</span>
					</div>
				)}

				<div className="mt-4 text-sm text-muted-foreground">
					<p>Действует: {formatDate(benefit.validFrom)} — {formatDate(benefit.validTo)}</p>
					{benefit.partner && (
						<p className="mt-1">Партнёр: {benefit.partner}</p>
					)}
				</div>
			</CardContent>
			<CardFooter className="flex gap-2">
				<Button variant="default" size="lg" asChild className="flex-1">
					<Link to={`/benefits/${benefit.id}`}>Подробнее</Link>
				</Button>
				<Button
					variant="outline"
					size="lg"
					onClick={handleSpeak}
					disabled={speaking}
					aria-label="Озвучить"
				>
					<Volume2 className="w-5 h-5" />
				</Button>
			</CardFooter>
		</Card>
	);
};
