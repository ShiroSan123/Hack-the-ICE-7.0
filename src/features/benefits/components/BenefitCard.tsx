import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Benefit } from '@/shared/types';
import { formatDate, formatCurrency } from '@/shared/lib/formatters';
import { Link } from 'react-router-dom';
import { Volume2, AlertCircle, Sparkles, Clock3, FileText } from 'lucide-react';
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
		<Card className="rounded-3xl border border-border/70 bg-white shadow-sm hover:shadow-lg transition-shadow">
			<CardHeader className="space-y-3">
				<div className="flex items-start justify-between gap-3">
					<div>
						<div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
							<span>{getBenefitTypeLabel(benefit.type)}</span>
							{benefit.isNew && (
								<span className="text-accent flex items-center gap-1">
									<Sparkles className="w-3 h-3" />
									Новое
								</span>
							)}
						</div>
						<CardTitle className="text-2xl leading-tight">{benefit.title}</CardTitle>
					</div>
					{benefit.savingsPerMonth && (
						<div className="rounded-2xl bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
							Экономия {formatCurrency(benefit.savingsPerMonth)}/мес
						</div>
					)}
				</div>
				<CardDescription className="text-base text-muted-foreground">
					{benefit.description}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{benefit.expiresIn && benefit.expiresIn < 90 && (
					<div className="flex items-center gap-3 rounded-2xl bg-destructive/5 px-4 py-3 text-destructive">
						<AlertCircle className="w-5 h-5" />
						<span className="font-semibold text-sm">Истекает через {benefit.expiresIn} дней</span>
					</div>
				)}
				<div className="grid gap-3 md:grid-cols-3">
					<div className="rounded-2xl border border-border/70 p-3">
						<p className="text-xs uppercase tracking-wide text-muted-foreground">Действует</p>
						<p className="text-sm font-semibold flex items-center gap-2">
							<Clock3 className="w-4 h-4" />
							{formatDate(benefit.validFrom)} — {formatDate(benefit.validTo)}
						</p>
					</div>
					{benefit.partner && (
						<div className="rounded-2xl border border-border/70 p-3">
							<p className="text-xs uppercase tracking-wide text-muted-foreground">Партнёр</p>
							<p className="text-sm font-semibold flex items-center gap-2">
								<FileText className="w-4 h-4" />
								{benefit.partner}
							</p>
						</div>
					)}
					<div className="rounded-2xl border border-border/70 p-3">
						<p className="text-xs uppercase tracking-wide text-muted-foreground">Требуется документов</p>
						<p className="text-sm font-semibold">{benefit.documents.length}</p>
					</div>
				</div>
			</CardContent>
			<CardFooter className="flex flex-wrap gap-2">
				<Button variant="default" size="lg" asChild className="flex-1 min-w-[180px]">
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
