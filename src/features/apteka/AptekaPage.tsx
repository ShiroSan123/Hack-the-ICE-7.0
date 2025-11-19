import { useEffect, useState } from 'react';
import { Layout } from '@/shared/ui/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card';
import { medicinesApi } from '@/shared/api/medicinesApi';
import { Medicine } from '@/shared/types';
import { useAppStore } from '@/shared/store/useAppStore';
import { MedicineCard } from './MedicineCard';
import { formatCurrency, formatDate } from '@/shared/lib/formatters';
import { Pill, TrendingDown, CalendarDays, HeartPulse, MessageCircle, Printer } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Link } from 'react-router-dom';

export const AptekaPage = () => {
	const [medicines, setMedicines] = useState<Medicine[]>([]);
	const [loading, setLoading] = useState(true);
	const { setMedicines: setStoreMedicines } = useAppStore();

	useEffect(() => {
		const loadMedicines = async () => {
			try {
				const data = await medicinesApi.getAll();
				setMedicines(data);
				setStoreMedicines(data);
			} catch (error) {
				console.error('Failed to load medicines:', error);
			} finally {
				setLoading(false);
			}
		};

		loadMedicines();
	}, [setStoreMedicines]);

	const totalMonthlyPrice = medicines.reduce((sum, med) => sum + med.monthlyPrice, 0);
	const totalDiscountedPrice = medicines.reduce(
		(sum, med) => sum + (med.discountedPrice ?? med.monthlyPrice),
		0
	);
	const monthlySavings = Math.max(totalMonthlyPrice - totalDiscountedPrice, 0);
	const nextRefill = medicines
		.filter((med) => med.refillDate)
		.sort((a, b) => (a.refillDate || '').localeCompare(b.refillDate || ''))[0]?.refillDate;
	const freeMeds = medicines.filter((med) => med.discountedPrice === 0).length;

	if (loading) {
		return (
			<Layout title="Моя аптечка">
				<div className="text-center py-12">
					<p className="text-xl">Загрузка...</p>
				</div>
			</Layout>
		);
	}

	return (
		<Layout title="Аптечка и рецепты">
			<div className="space-y-8">
				<section className="grid gap-4 lg:grid-cols-4">
					<Card className="rounded-3xl">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Pill className="w-6 h-6 text-primary" />Всего препаратов
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-4xl font-bold">{medicines.length}</p>
							<p className="text-sm text-muted-foreground">{freeMeds} доступно бесплатно</p>
						</CardContent>
					</Card>

					<Card className="rounded-3xl">
						<CardHeader>
							<CardTitle>Расходы в месяц</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground line-through">{formatCurrency(totalMonthlyPrice)}</p>
							<p className="text-3xl font-bold text-primary">{formatCurrency(totalDiscountedPrice)}</p>
						</CardContent>
					</Card>

					<Card className="rounded-3xl bg-primary/5 border-primary/20">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-primary">
								<TrendingDown className="w-6 h-6" />Экономия в месяц
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-4xl font-bold text-primary">{formatCurrency(monthlySavings)}</p>
						</CardContent>
					</Card>

					<Card className="rounded-3xl">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<CalendarDays className="w-6 h-6 text-primary" />Ближайшее продление
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold">
								{nextRefill ? formatDate(nextRefill) : 'нет напоминаний'}
							</p>
							<p className="text-sm text-muted-foreground">Обновите рецепт заранее, чтобы не потерять скидку.</p>
						</CardContent>
					</Card>
				</section>

				<div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
					<div className="space-y-4">
						<h2 className="text-2xl font-bold">Лекарства и препараты</h2>
						{medicines.map((medicine) => (
							<MedicineCard key={medicine.id} medicine={medicine} />
						))}

						{medicines.length === 0 && (
							<Card>
								<CardContent className="py-12 text-center">
									<Pill className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
									<p className="text-xl text-muted-foreground">Добавьте лекарства, чтобы следить за расходами</p>
								</CardContent>
							</Card>
						)}
					</div>

					<aside className="space-y-4">
						<Card className="rounded-3xl bg-secondary">
							<CardHeader>
								<CardTitle>Партнёрская сеть</CardTitle>
								<CardDescription>Часть лекарств доступна со скидкой или бесплатно в аптечной сети <strong>xxxxxxxxx</strong>.</CardDescription>
							</CardHeader>
						</Card>

						<Card className="rounded-3xl">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<HeartPulse className="w-6 h-6 text-primary" />Действия
								</CardTitle>
								<CardDescription>Сохраните список лекарств или задайте вопрос.</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<Button variant="outline" size="lg" asChild className="w-full">
									<Link to="/assistant">
										<MessageCircle className="w-5 h-5" />
										Спросить ассистента
									</Link>
								</Button>
								<Button variant="accent" size="lg" asChild className="w-full">
									<Link to="/print">
										<Printer className="w-5 h-5" />
										Отчёт для врача
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
