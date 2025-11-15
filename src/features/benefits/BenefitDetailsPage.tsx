import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/shared/ui/Layout';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';
import { benefitsApi } from '@/shared/api/benefitsApi';
import { useAppStore } from '@/shared/store/useAppStore';
import { Benefit } from '@/shared/types';
import { formatDate, formatCurrency } from '@/shared/lib/formatters';
import { ArrowLeft, Volume2, EyeOff, CheckCircle2 } from 'lucide-react';
import { useTTS } from '@/shared/lib/useTTS';
import { toast } from 'sonner';

export const BenefitDetailsPage = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { toggleHiddenBenefit, hiddenBenefitIds } = useAppStore();
	const [benefit, setBenefit] = useState<Benefit | null>(null);
	const { speak, speaking } = useTTS();

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
		const text = `${benefit.title}. ${benefit.description}. 
      Требования: ${benefit.requirements.join(', ')}. 
      Шаги получения: ${benefit.steps.join(', ')}`;
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
			<div className="max-w-4xl mx-auto">
				<Button
					variant="ghost"
					size="lg"
					onClick={() => navigate(-1)}
					className="mb-6"
				>
					<ArrowLeft className="w-5 h-5 mr-2" />
					Назад
				</Button>

				<Card>
					<CardHeader>
						<div className="flex items-start justify-between gap-4">
							<CardTitle className="text-3xl">{benefit.title}</CardTitle>
							<Button
								variant="outline"
								size="lg"
								onClick={handleSpeak}
								disabled={speaking}
							>
								<Volume2 className="w-5 h-5" />
							</Button>
						</div>
					</CardHeader>
					<CardContent className="space-y-6">
						<div>
							<h3 className="text-xl font-semibold mb-2">Описание</h3>
							<p className="text-lg leading-relaxed">{benefit.description}</p>
						</div>

						{benefit.savingsPerMonth && (
							<div className="p-4 bg-primary/10 rounded-lg">
								<p className="text-lg font-semibold text-primary">
									Экономия в месяц: {formatCurrency(benefit.savingsPerMonth)}
								</p>
							</div>
						)}

						<div>
							<h3 className="text-xl font-semibold mb-3">Требования</h3>
							<ul className="space-y-2">
								{benefit.requirements.map((req, idx) => (
									<li key={idx} className="flex items-start gap-3">
										<CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
										<span className="text-lg">{req}</span>
									</li>
								))}
							</ul>
						</div>

						<div>
							<h3 className="text-xl font-semibold mb-3">Необходимые документы</h3>
							<ul className="space-y-2">
								{benefit.documents.map((doc, idx) => (
									<li key={idx} className="flex items-start gap-3">
										<CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
										<span className="text-lg">{doc}</span>
									</li>
								))}
							</ul>
						</div>

						<div>
							<h3 className="text-xl font-semibold mb-3">Шаги получения</h3>
							<ol className="space-y-3">
								{benefit.steps.map((step, idx) => (
									<li key={idx} className="flex gap-3">
										<span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
											{idx + 1}
										</span>
										<span className="text-lg pt-1">{step}</span>
									</li>
								))}
							</ol>
						</div>

						<div className="grid md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
							<div>
								<p className="text-sm text-muted-foreground mb-1">Срок действия</p>
								<p className="text-base font-medium">
									{formatDate(benefit.validFrom)} — {formatDate(benefit.validTo)}
								</p>
							</div>
							{benefit.partner && (
								<div>
									<p className="text-sm text-muted-foreground mb-1">Партнёр</p>
									<p className="text-base font-medium">{benefit.partner}</p>
								</div>
							)}
						</div>

						<div className="flex gap-4 pt-4">
							<Button
								variant="outline"
								size="lg"
								onClick={handleHide}
								className="flex-1"
							>
								<EyeOff className="w-5 h-5 mr-2" />
								{isHidden ? 'Показать льготу' : 'Скрыть льготу'}
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</Layout>
	);
};
