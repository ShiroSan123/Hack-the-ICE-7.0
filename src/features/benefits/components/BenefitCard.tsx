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
	const { speak, speaking, available: ttsAvailable } = useTTS();
	const stepsPreview = benefit.steps.slice(0, 2);

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
		if (!ttsAvailable) return;
		const text = `${benefit.title}. ${benefit.description}`;
		speak(text);
	};

	return (
		<Card className="relative overflow-hidden rounded-3xl border border-border/70 bg-white shadow-sm hover:shadow-xl transition-all">
			<div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-primary/10 via-white to-accent/10" aria-hidden />
			<CardHeader className="relative space-y-4">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="space-y-2">
						<div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
							<span className="rounded-full bg-white/80 px-3 py-1 text-primary border border-primary/20">
								{getBenefitTypeLabel(benefit.type)}
							</span>
							{benefit.isNew && (
								<span className="flex items-center gap-1 rounded-full bg-accent text-accent-foreground px-3 py-1">
									<Sparkles className="w-3 h-3" />
									Новое
								</span>
							)}
							{benefit.expiresIn && (
								<span className="flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-3 py-1">
									<AlertCircle className="w-3 h-3" />
									{benefit.expiresIn} дн.
								</span>
							)}
						</div>
						<CardTitle className="text-2xl leading-tight">{benefit.title}</CardTitle>
					</div>
					{benefit.savingsPerMonth && (
						<div className="rounded-2xl bg-primary/10 px-3 py-1 text-sm font-semibold text-primary shadow-sm">
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
					<div className="rounded-2xl border border-border/70 bg-white/50 p-3">
						<p className="text-xs uppercase tracking-wide text-muted-foreground">Действует</p>
						<p className="text-sm font-semibold flex items-center gap-2">
							<Clock3 className="w-4 h-4" />
							{formatDate(benefit.validFrom)} — {formatDate(benefit.validTo)}
						</p>
					</div>
					{benefit.partner && (
						<div className="rounded-2xl border border-border/70 bg-white/50 p-3">
							<p className="text-xs uppercase tracking-wide text-muted-foreground">Партнёр</p>
							<p className="text-sm font-semibold flex items-center gap-2">
								<FileText className="w-4 h-4" />
								{benefit.partner}
							</p>
						</div>
					)}
					<div className="rounded-2xl border border-border/70 bg-white/50 p-3">
						<p className="text-xs uppercase tracking-wide text-muted-foreground">Требуется документов</p>
						<p className="text-sm font-semibold">{benefit.documents.length}</p>
					</div>
				</div>

				{stepsPreview.length > 0 && (
					<div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
						<p className="text-xs uppercase tracking-[0.3em] text-primary/80">Первые шаги</p>
						<ul className="space-y-2">
							{stepsPreview.map((step, index) => (
								<li key={index} className="flex items-start gap-2 text-sm text-foreground">
									<span className="mt-[2px] flex h-6 w-6 items-center justify-center rounded-full bg-white text-primary border border-primary/30 text-xs font-semibold">
										{index + 1}
									</span>
									<span className="leading-snug">{step}</span>
								</li>
							))}
						</ul>
					</div>
				)}
			</CardContent>
			<CardFooter className="flex flex-wrap gap-2">
				<Button variant="default" size="lg" asChild className="flex-1 min-w-[180px]">
					<Link to={`/benefits/${benefit.id}`}>Подробнее</Link>
				</Button>
				<Button
					variant="outline"
					size="lg"
					onClick={handleSpeak}
					disabled={speaking || !ttsAvailable}
					aria-label="Озвучить"
				>
					<Volume2 className="w-5 h-5" />
					{!ttsAvailable && <span className="text-xs text-muted-foreground">Нет озвучки</span>}
				</Button>
			</CardFooter>
		</Card>
	);
};
