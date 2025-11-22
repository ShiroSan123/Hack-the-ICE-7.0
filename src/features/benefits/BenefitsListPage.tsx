import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/shared/ui/Layout';
import { useAppStore } from '@/shared/store/useAppStore';
import { benefitsApi } from '@/shared/api/benefitsApi';
import { BenefitCard } from './components/BenefitCard';
import { BenefitsFilters } from './components/BenefitsFilters';
import { Benefit } from '@/shared/types';
import { Loader2, Lightbulb, MessageCircle, Printer } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Link } from 'react-router-dom';

export const BenefitsListPage = () => {
	const { benefits, setBenefits, hiddenBenefitIds, user } = useAppStore();
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedType, setSelectedType] = useState('all');

	useEffect(() => {
		setLoading(true);
		const loadBenefits = async () => {
			try {
				const data = await benefitsApi.getForProfile(user);
				setBenefits(data);
			} catch (error) {
				console.error('Failed to load benefits:', error);
			} finally {
				setLoading(false);
			}
		};

		loadBenefits();
	}, [setBenefits, user]);

	const accessibleBenefits = useMemo(() => {
		if (!user) return benefits;
		return benefits.filter((benefit: Benefit) => {
			const matchesRegion =
				benefit.regions.includes(user.region) || benefit.regions.includes('all');
			const matchesCategory = benefit.targetGroups.includes(user.category);
			return matchesRegion && matchesCategory;
		});
	}, [benefits, user]);

	const filteredBenefits = accessibleBenefits.filter((benefit: Benefit) => {
		// Filter hidden
		if (hiddenBenefitIds.includes(benefit.id)) return false;

		// Filter by user region
		if (user && !benefit.regions.includes(user.region) && !benefit.regions.includes('all')) {
			return false;
		}

		// Filter by user category
		if (user && !benefit.targetGroups.includes(user.category)) {
			return false;
		}

		// Filter by search query
		if (searchQuery && !benefit.title.toLowerCase().includes(searchQuery.toLowerCase())) {
			return false;
		}

		// Filter by type
		if (selectedType !== 'all' && benefit.type !== selectedType) {
			return false;
		}

		return true;
	});

	const summary = [
		{
			label: 'Всего льгот',
			value: accessibleBenefits.length,
			accent: 'from-primary/20 to-primary/5',
		},
		{
			label: 'Новых предложений',
			value: accessibleBenefits.filter((b) => b.isNew).length,
			accent: 'from-accent/30 to-amber-50',
		},
		{
			label: 'Истекают скоро',
			value: accessibleBenefits.filter((b) => b.expiresIn && b.expiresIn < 90).length,
			accent: 'from-rose-100 to-rose-50',
		},
	];

	if (loading) {
		return (
			<Layout title="Льготы моего региона">
				<div className="flex items-center justify-center min-h-[400px]">
					<Loader2 className="w-12 h-12 animate-spin text-primary" />
				</div>
			</Layout>
		);
	}

	return (
		<Layout title="Льготы моего региона">
			<div className="space-y-8">
				<section className="grid gap-4 md:grid-cols-3">
					{summary.map((item) => (
						<div
							key={item.label}
							className={`rounded-3xl border border-border/60 bg-gradient-to-br ${item.accent} p-5 shadow-sm`}
						>
							<p className="text-sm text-muted-foreground">{item.label}</p>
							<p className="text-4xl font-bold text-slate-900">{item.value}</p>
						</div>
					))}
				</section>

				<div className="grid gap-6 lg:grid-cols-[360px,1fr]">
					<div className="space-y-4">
						<BenefitsFilters
							searchQuery={searchQuery}
							onSearchChange={setSearchQuery}
							selectedType={selectedType}
							onTypeChange={setSelectedType}
						/>

						<Card className="rounded-3xl">
							<CardContent className="pt-6 space-y-4">
								<div className="flex items-center gap-3">
									<div className="rounded-2xl bg-primary/10 p-3 text-primary">
										<Lightbulb className="w-5 h-5" />
									</div>
									<div>
										<p className="font-semibold">Не нашли нужную льготу?</p>
										<p className="text-sm text-muted-foreground">Попросите ассистента подобрать выплаты или переключитесь в простой режим.</p>
									</div>
								</div>
								<div className="flex flex-col gap-2">
									<Button variant="outline" size="lg" asChild>
										<Link to="/assistant">
											<MessageCircle className="w-5 h-5" />
											Вопрос ассистенту
										</Link>
									</Button>
									<Button variant="ghost" size="lg" asChild>
										<Link to="/simple">
											<Printer className="w-5 h-5" />
											Простой режим / печать
										</Link>
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>

					<div className="space-y-4">
						{filteredBenefits.length === 0 ? (
							<div className="rounded-3xl border border-dashed border-border/70 p-12 text-center">
								<p className="text-xl font-semibold mb-2">Льготы не найдены</p>
								<p className="text-muted-foreground">Попробуйте изменить фильтры или уточните данные профиля.</p>
							</div>
						) : (
							filteredBenefits.map((benefit: Benefit) => (
								<BenefitCard key={benefit.id} benefit={benefit} />
							))
						)}
					</div>
				</div>
			</div>
		</Layout>
	);
};
