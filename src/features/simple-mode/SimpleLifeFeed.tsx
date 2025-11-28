import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { benefitsApi } from '@/shared/api/benefitsApi';
import { offersApi } from '@/shared/api/offersApi';
import { medicinesApi } from '@/shared/api/medicinesApi';
import { useAppStore } from '@/shared/store/useAppStore';
import { Benefit } from '@/shared/types';
import { Link } from 'react-router-dom';
import { normalizeTargetGroup } from '@/shared/lib/targetGroups';
import { formatCurrency } from '@/shared/lib/formatters';
import SimpleShell from './SimpleShell';

export const SimpleLifeFeed = () => {
	const { user, benefits, offers, medicines, setBenefits, setOffers, setMedicines } = useAppStore();
	const [loading, setLoading] = useState(false);
	const normalizedUserCategory = user ? normalizeTargetGroup(user.category) : null;

	useEffect(() => {
		if (benefits.length && offers.length && medicines.length) return;
		setLoading(true);
		Promise.all([
			benefitsApi.getForProfile(user),
			offersApi.getAll(),
			medicinesApi.getAll(),
		])
			.then(([b, o, m]) => {
				setBenefits(b);
				setOffers(o);
				setMedicines(m);
			})
			.finally(() => setLoading(false));
	}, [benefits.length, offers.length, medicines.length, setBenefits, setOffers, setMedicines, user]);

	const accessibleBenefits = useMemo(() => {
		if (!user) return benefits;
		return benefits.filter(
			(benefit: Benefit) =>
				(!normalizedUserCategory || benefit.targetGroups.includes(normalizedUserCategory)) &&
				(benefit.regions.includes(user.region) || benefit.regions.includes('all'))
		);
	}, [benefits, normalizedUserCategory, user]);

	const newCount = accessibleBenefits.filter((b) => b.isNew).length;
	const expiringCount = accessibleBenefits.filter((b) => b.expiresIn && b.expiresIn < 90).length;
	const medsCount = medicines.length;
	const topBenefit = accessibleBenefits.find((b) => b.isNew) || accessibleBenefits[0];

	return (
		<SimpleShell
			title="Главное просто"
			description="Крупные кнопки и только важное. Всё остальное — в основном режиме."
		>
			<div className="grid gap-4 md:grid-cols-3">
				<div className="rounded-3xl bg-primary text-primary-foreground p-5 shadow-lg">
					<p className="text-sm opacity-90">Новые льготы</p>
					<p className="text-4xl font-bold">{newCount}</p>
				</div>
				<div className="rounded-3xl bg-amber-500 text-amber-50 p-5 shadow-lg">
					<p className="text-sm opacity-90">Истекают скоро</p>
					<p className="text-4xl font-bold">{expiringCount}</p>
				</div>
				<div className="rounded-3xl bg-emerald-500 text-white p-5 shadow-lg">
					<p className="text-sm opacity-90">Лекарств</p>
					<p className="text-4xl font-bold">{medsCount}</p>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Button size="huge" variant="accent" asChild className="h-auto py-10">
					<Link to="/benefits">Мои льготы</Link>
				</Button>
				<Button size="huge" variant="outline" asChild className="h-auto py-10">
					<Link to="/assistant">Задать вопрос</Link>
				</Button>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Button size="huge" variant="default" asChild className="h-auto py-10">
					<Link to="/apteka">Аптечка</Link>
				</Button>
				<Button size="huge" variant="ghost" asChild className="h-auto py-10">
					<Link to="/print">Печать</Link>
				</Button>
			</div>

			{topBenefit && (
				<div className="rounded-3xl bg-white/90 border border-border/70 p-5 shadow-sm space-y-3">
					<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Подходит вам</p>
					<h2 className="text-2xl font-bold">{topBenefit.title}</h2>
					<p className="text-lg text-muted-foreground">{topBenefit.description}</p>
					<div className="flex flex-wrap gap-2 text-sm">
						{topBenefit.savingsPerMonth && (
							<span className="rounded-full bg-primary/10 text-primary px-3 py-1 font-semibold">
								Экономия {formatCurrency(topBenefit.savingsPerMonth)}
							</span>
						)}
						{topBenefit.expiresIn && (
							<span className="rounded-full bg-amber-50 text-amber-700 px-3 py-1 font-semibold">
								{topBenefit.expiresIn} дней
							</span>
						)}
					</div>
					<Button variant="accent" size="lg" asChild>
						<Link to={`/benefits/${topBenefit.id}`}>Подробнее</Link>
					</Button>
				</div>
			)}

			{loading && <p className="text-sm text-muted-foreground">Загружаем данные...</p>}
		</SimpleShell>
	);
};

export default SimpleLifeFeed;
