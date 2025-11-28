import { useEffect, useMemo, useState } from 'react';
import { medicinesApi } from '@/shared/api/medicinesApi';
import { useAppStore } from '@/shared/store/useAppStore';
import { formatCurrency, formatDate } from '@/shared/lib/formatters';
import { Medicine } from '@/shared/types';
import { Button } from '@/shared/ui/Button';
import { Link } from 'react-router-dom';
import SimpleShell from './SimpleShell';

export const SimpleAptekaPage = () => {
	const { medicines, setMedicines } = useAppStore();
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (medicines.length) return;
		setLoading(true);
		medicinesApi
			.getAll()
			.then(setMedicines)
			.finally(() => setLoading(false));
	}, [medicines.length, setMedicines]);

	const totals = useMemo(() => {
		const total = medicines.reduce((sum, med) => sum + med.monthlyPrice, 0);
		const discounted = medicines.reduce(
			(sum, med) => sum + (typeof med.discountedPrice === 'number' ? med.discountedPrice : med.monthlyPrice),
			0
		);
		return {
			total,
			discounted,
			save: Math.max(total - discounted, 0),
		};
	}, [medicines]);

	const nextRefill = medicines
		.filter((med) => med.refillDate)
		.sort((a, b) => (a.refillDate || '').localeCompare(b.refillDate || ''))[0]?.refillDate;

	return (
		<SimpleShell
			title="Аптечка просто"
			description="Суммы и ближайшее продление. Детали — в основном режиме."
		>
			<div className="grid gap-4 md:grid-cols-3">
				<div className="rounded-3xl bg-primary text-primary-foreground p-5 shadow-lg">
					<p className="text-sm opacity-80">Препаратов</p>
					<p className="text-4xl font-bold">{medicines.length}</p>
				</div>
				<div className="rounded-3xl bg-emerald-500 text-white p-5 shadow-lg">
					<p className="text-sm opacity-80">Расход в месяц</p>
					<p className="text-3xl font-bold">{formatCurrency(totals.discounted)}</p>
				</div>
				<div className="rounded-3xl bg-amber-500 text-white p-5 shadow-lg">
					<p className="text-sm opacity-80">Продлить до</p>
					<p className="text-xl font-bold">{nextRefill ? formatDate(nextRefill) : '—'}</p>
				</div>
			</div>

			<div className="space-y-3 mt-4">
				{medicines.map((med: Medicine) => (
					<div key={med.id} className="rounded-2xl border border-border/70 bg-white/90 p-4 flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<p className="text-lg font-semibold">{med.name}</p>
							<span className="text-sm text-primary font-semibold">{formatCurrency(med.discountedPrice ?? med.monthlyPrice)}</span>
						</div>
						<p className="text-sm text-muted-foreground">{med.dosage} — {med.frequency}</p>
						{med.refillDate && (
							<p className="text-sm text-amber-700">Продлить до {formatDate(med.refillDate)}</p>
						)}
					</div>
				))}
				{!medicines.length && !loading && (
					<p className="text-muted-foreground">Нет лекарств. Добавьте их в основном режиме.</p>
				)}
				{loading && <p className="text-sm text-muted-foreground">Загружаем лекарства...</p>}
			</div>

			<div className="grid gap-3 md:grid-cols-3 mt-4">
				<Button variant="accent" size="xl" asChild className="h-auto py-4">
					<Link to="/assistant">Спросить</Link>
				</Button>
				<Button variant="outline" size="xl" asChild className="h-auto py-4">
					<Link to="/print">Печать</Link>
				</Button>
				<Button variant="ghost" size="xl" asChild className="h-auto py-4">
					<Link to="/dashboard">Назад</Link>
				</Button>
			</div>
		</SimpleShell>
	);
};

export default SimpleAptekaPage;
