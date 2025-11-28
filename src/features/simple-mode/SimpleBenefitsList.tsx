import { useEffect, useMemo, useState } from 'react';
import { benefitsApi } from '@/shared/api/benefitsApi';
import { useAppStore } from '@/shared/store/useAppStore';
import { Benefit } from '@/shared/types';
import { normalizeTargetGroup } from '@/shared/lib/targetGroups';
import { Button } from '@/shared/ui/Button';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/shared/lib/formatters';
import SimpleShell from './SimpleShell';

export const SimpleBenefitsList = () => {
	const { benefits, setBenefits, user, hiddenBenefitIds } = useAppStore();
	const [loading, setLoading] = useState(false);
	const normalizedUserCategory = user ? normalizeTargetGroup(user.category) : null;

	useEffect(() => {
		if (benefits.length) return;
		setLoading(true);
		benefitsApi
			.getForProfile(user)
			.then(setBenefits)
			.finally(() => setLoading(false));
	}, [benefits.length, setBenefits, user]);

	const accessibleBenefits = useMemo(() => {
		if (!user) return benefits;
		return benefits.filter((benefit: Benefit) => {
			const matchesRegion = benefit.regions.includes(user.region) || benefit.regions.includes('all');
			const matchesCategory = !normalizedUserCategory || benefit.targetGroups.includes(normalizedUserCategory);
			return matchesRegion && matchesCategory;
		});
	}, [benefits, normalizedUserCategory, user]);

	const filtered = accessibleBenefits.filter((benefit) => !hiddenBenefitIds.includes(benefit.id));

	return (
		<SimpleShell
			title="Льготы крупно"
			description="Только список и большие кнопки. Полный фильтр — в основном режиме."
		>
			<div className="space-y-3">
				{filtered.map((benefit) => (
					<div key={benefit.id} className="rounded-3xl border border-border/70 bg-white/90 p-4 shadow-sm space-y-2">
						<div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
							<span className="rounded-full bg-primary/10 text-primary px-3 py-1">{benefit.type}</span>
							{benefit.isNew && <span className="rounded-full bg-accent text-accent-foreground px-3 py-1">Новое</span>}
							{benefit.expiresIn && <span className="rounded-full bg-amber-50 text-amber-700 px-3 py-1">{benefit.expiresIn} дн.</span>}
						</div>
						<h2 className="text-xl font-semibold leading-tight">{benefit.title}</h2>
						<p className="text-base text-muted-foreground">{benefit.description}</p>
						<div className="flex flex-wrap gap-2 text-sm">
							<span className="rounded-full bg-background px-3 py-1">{formatDate(benefit.validFrom)} — {formatDate(benefit.validTo)}</span>
							{benefit.savingsPerMonth && (
								<span className="rounded-full bg-primary/10 text-primary px-3 py-1 font-semibold">
									{formatCurrency(benefit.savingsPerMonth)}
								</span>
							)}
						</div>
						<Button variant="accent" size="lg" asChild className="w-full mt-2">
							<Link to={`/benefits/${benefit.id}`}>Открыть</Link>
						</Button>
					</div>
				))}

				{!filtered.length && !loading && (
					<p className="text-muted-foreground">Льготы не найдены для вашего профиля.</p>
				)}
				{loading && <p className="text-sm text-muted-foreground">Загружаем льготы...</p>}
			</div>
		</SimpleShell>
	);
};

export default SimpleBenefitsList;
