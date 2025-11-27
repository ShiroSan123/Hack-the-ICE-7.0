import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/shared/ui/Layout';
import { Button } from '@/shared/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/Card';
import { benefitsApi } from '@/shared/api/benefitsApi';
import { useAppStore } from '@/shared/store/useAppStore';
import { Benefit } from '@/shared/types';
import { formatDate, formatCurrency } from '@/shared/lib/formatters';
import { ArrowLeft, Volume2, EyeOff, CheckCircle2, Printer, MessageCircle, Sparkles } from 'lucide-react';
import { useTTS } from '@/shared/lib/useTTS';
import { toast } from 'sonner';

const typeLabels: Record<string, string> = {
	social: 'Социальная',
	medical: 'Медицинская',
	transport: 'Транспорт',
	housing: 'Жильё',
	utility: 'ЖКХ',
	tax: 'Налоги',
	education: 'Образование',
	culture: 'Культура',
};

export const BenefitDetailsPage = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { toggleHiddenBenefit, hiddenBenefitIds } = useAppStore();
	const [benefit, setBenefit] = useState<Benefit | null>(null);
	const { speak, speaking, available: ttsAvailable } = useTTS();

	const isHidden = id ? hiddenBenefitIds.includes(id) : false;

	useEffect(() => {
		const loadBenefit = async () => {
			if (!id) return;
			const data = await benefitsApi.getById(id);
			if (data) {
				setBenefit(data);
			}
		};

		loadBenefit();
	}, [id]);

	const typeLabel = useMemo(() => {
		if (!benefit) return '';
		return typeLabels[benefit.type] ?? benefit.type;
	}, [benefit]);

	if (!benefit) {
		return (
			<Layout>
				<div className="text-center py-12">
					<p className="text-xl">Загрузка...</p>
				</div>
			</Layout>
		);
	}

	const handleSpeak = () => {
		if (!ttsAvailable) return;
		const text = `${benefit.title}. ${benefit.description}. Требования: ${benefit.requirements.join(', ')}. Шаги: ${benefit.steps.join(', ')}`;
		speak(text);
	};

	const handleHide = () => {
		if (id) {
			toggleHiddenBenefit(id);
			toast.success(isHidden ? 'Льгота снова видна' : 'Льгота скрыта');
		}
	};

	return (
		<Layout>
			<div className="space-y-6">
				<div className="rounded-3xl bg-gradient-to-br from-primary/25 via-primary/10 to-white p-6 md:p-8 shadow-sm">
					<div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-primary font-semibold">
						<Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="px-0 text-primary">
							<ArrowLeft className="w-4 h-4" />
							Назад
						</Button>
						<span className="uppercase tracking-[0.3em]">{typeLabel}</span>
					</div>
					<h1 className="text-3xl md:text-4xl font-bold text-slate-900">{benefit.title}</h1>
					<p className="mt-3 text-lg text-slate-700 max-w-3xl">{benefit.description}</p>
					<div className="mt-4 flex flex-wrap gap-3">
						{benefit.isNew && (
							<span className="rounded-2xl bg-accent text-accent-foreground px-3 py-1 text-sm font-semibold flex items-center gap-1">
								<Sparkles className="w-4 h-4" />Новое
							</span>
						)}
						{benefit.savingsPerMonth && (
							<span className="rounded-2xl bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold">
								Экономия {formatCurrency(benefit.savingsPerMonth)} в месяц
							</span>
						)}
						<span className="rounded-2xl bg-white/70 px-3 py-1 text-sm font-semibold text-primary">
							Действует: {formatDate(benefit.validFrom)} — {formatDate(benefit.validTo)}
						</span>
					</div>
					<div className="mt-6 flex flex-wrap gap-3">
						<Button variant="accent" size="lg" onClick={handleSpeak} disabled={speaking || !ttsAvailable}>
							<Volume2 className="w-5 h-5" />
							Озвучить льготу
						</Button>
						<Button variant="outline" size="lg" asChild>
							<Link to="/print">
								<Printer className="w-5 h-5" />
								Для печати
							</Link>
						</Button>
					</div>
				</div>

				<div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
					<div className="space-y-6">
						<Card className="rounded-3xl">
							<CardHeader>
								<CardTitle>Требования</CardTitle>
								<CardDescription>Что нужно подтвердить.</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="space-y-3">
									{benefit.requirements.map((req, idx) => (
										<li key={idx} className="flex items-start gap-3">
											<CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
											<span>{req}</span>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>

						<Card className="rounded-3xl">
							<CardHeader>
								<CardTitle>Документы</CardTitle>
								<CardDescription>Подготовьте заранее оригиналы и копии.</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="space-y-3">
									{benefit.documents.map((doc, idx) => (
										<li key={idx} className="flex items-start gap-3">
											<CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
											<span>{doc}</span>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>

						<Card className="rounded-3xl">
							<CardHeader>
								<CardTitle>Шаги получения</CardTitle>
								<CardDescription>Следуйте подсказкам по порядку.</CardDescription>
							</CardHeader>
							<CardContent>
								<ol className="space-y-4">
									{benefit.steps.map((step, idx) => (
										<li key={idx} className="flex items-start gap-3">
											<span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
												{idx + 1}
											</span>
											<p className="text-base">{step}</p>
										</li>
									))}
								</ol>
							</CardContent>
						</Card>
					</div>

					<aside className="space-y-4">
						<Card className="rounded-3xl">
							<CardContent className="space-y-4 pt-6">
								<div>
									<p className="text-sm text-muted-foreground">Срок действия</p>
									<p className="text-base font-semibold">{formatDate(benefit.validFrom)} — {formatDate(benefit.validTo)}</p>
								</div>
								{benefit.partner && (
									<div>
										<p className="text-sm text-muted-foreground">Партнёр</p>
										<p className="text-base font-semibold">{benefit.partner}</p>
									</div>
								)}
								{benefit.savingsPerMonth && (
									<div>
										<p className="text-sm text-muted-foreground">Экономия</p>
										<p className="text-2xl font-bold text-primary">{formatCurrency(benefit.savingsPerMonth)}</p>
									</div>
								)}
							</CardContent>
						</Card>

						<Card className="rounded-3xl">
							<CardContent className="pt-6 space-y-3">
								<Button variant="outline" size="lg" className="w-full" onClick={handleHide}>
									<EyeOff className="w-5 h-5" />
									{isHidden ? 'Показать в списке' : 'Скрыть из ленты'}
								</Button>
								<Button variant="accent" size="lg" asChild className="w-full">
									<Link to="/assistant">
										<MessageCircle className="w-5 h-5" />
										Спросить в чате
									</Link>
								</Button>
							</CardContent>
						</Card>
					</aside>
				</div>
			</div>
		</Layout>
	);
};
