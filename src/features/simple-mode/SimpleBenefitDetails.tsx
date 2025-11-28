import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { benefitsApi } from '@/shared/api/benefitsApi';
import { Benefit } from '@/shared/types';
import { Button } from '@/shared/ui/Button';
import { formatCurrency, formatDate } from '@/shared/lib/formatters';
import SimpleShell from './SimpleShell';

export const SimpleBenefitDetails = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [benefit, setBenefit] = useState<Benefit | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!id) return;
		setLoading(true);
		benefitsApi
			.getById(id)
			.then((data) => setBenefit(data ?? null))
			.finally(() => setLoading(false));
	}, [id]);

	const steps = useMemo(() => benefit?.steps?.slice(0, 5) ?? [], [benefit]);
	const documents = useMemo(() => benefit?.documents?.slice(0, 5) ?? [], [benefit]);

	if (!benefit && loading) {
		return (
			<SimpleShell title="Льгота" description="Загружаем данные...">
				<p className="text-muted-foreground">Пожалуйста, подождите.</p>
			</SimpleShell>
		);
	}

	if (!benefit) {
		return (
			<SimpleShell title="Льгота" description="Не нашли эту льготу">
				<Button variant="accent" size="lg" onClick={() => navigate(-1)}>Назад</Button>
			</SimpleShell>
		);
	}

	return (
		<SimpleShell
			title={benefit.title}
			description={benefit.description}
		>
			<div className="space-y-4 rounded-3xl bg-white/90 border border-border/70 p-4 shadow-sm">
				<p className="text-sm text-muted-foreground">Действует: {formatDate(benefit.validFrom)} — {formatDate(benefit.validTo)}</p>
				{benefit.expiresIn && (
					<p className="text-base font-semibold text-amber-700">Заканчивается через {benefit.expiresIn} дней</p>
				)}
				{benefit.savingsPerMonth && (
					<p className="text-lg font-semibold text-primary">Экономия {formatCurrency(benefit.savingsPerMonth)}</p>
				)}
			</div>

			<div className="rounded-3xl bg-white/90 border border-border/70 p-4 shadow-sm space-y-3">
				<h2 className="text-xl font-semibold">Шаги</h2>
				<ol className="space-y-2 text-base">
					{steps.map((step, idx) => (
						<li key={idx} className="flex items-start gap-3">
							<span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">{idx + 1}</span>
							<span>{step}</span>
						</li>
					))}
					{!steps.length && <p className="text-muted-foreground">Шаги появятся позже.</p>}
				</ol>
			</div>

			<div className="rounded-3xl bg-white/90 border border-border/70 p-4 shadow-sm space-y-3">
				<h2 className="text-xl font-semibold">Документы</h2>
				<ul className="space-y-2 text-base">
					{documents.map((doc, idx) => (
						<li key={idx} className="flex items-start gap-3">
							<span className="mt-1 h-3 w-3 rounded-full bg-primary inline-block" aria-hidden />
							<span>{doc}</span>
						</li>
					))}
					{!documents.length && <p className="text-muted-foreground">Список документов уточняется.</p>}
				</ul>
			</div>

			<div className="grid gap-3 md:grid-cols-3">
				<Button variant="accent" size="xl" asChild className="h-auto py-4">
					<Link to="/assistant">Спросить</Link>
				</Button>
				<Button variant="outline" size="xl" asChild className="h-auto py-4">
					<Link to="/print">Печать</Link>
				</Button>
				<Button variant="ghost" size="xl" onClick={() => navigate(-1)} className="h-auto py-4">
					Назад
				</Button>
			</div>
		</SimpleShell>
	);
};

export default SimpleBenefitDetails;
