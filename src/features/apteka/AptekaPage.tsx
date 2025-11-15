import { useEffect, useState } from 'react';
import { Layout } from '@/shared/ui/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card';
import { apiClient } from '@/shared/api/apiClient';
import { Medicine } from '@/shared/types';
import { useAppStore } from '@/shared/store/useAppStore';
import { MedicineCard } from './MedicineCard';
import { formatCurrency } from '@/shared/lib/formatters';
import { Pill, TrendingDown } from 'lucide-react';

export const AptekaPage = () => {
	const [medicines, setMedicines] = useState<Medicine[]>([]);
	const [loading, setLoading] = useState(true);
	const { setMedicines: setStoreMedicines } = useAppStore();

	useEffect(() => {
		const loadMedicines = async () => {
			try {
				const data = await apiClient.get<Medicine[]>('/mock-data/medicines.json');
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
		(sum, med) => sum + (med.discountedPrice || med.monthlyPrice),
		0
	);
	const monthlySavings = totalMonthlyPrice - totalDiscountedPrice;

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
		<Layout title="Моя аптечка">
			<div className="space-y-6">
				<div className="grid md:grid-cols-3 gap-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Pill className="w-6 h-6 text-primary" />
								Лекарств
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-bold">{medicines.length}</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Расходы в месяц</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-bold text-muted-foreground line-through">
								{formatCurrency(totalMonthlyPrice)}
							</p>
							<p className="text-2xl font-bold text-primary mt-1">
								{formatCurrency(totalDiscountedPrice)}
							</p>
						</CardContent>
					</Card>

					<Card className="bg-primary/5 border-primary/20">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-primary">
								<TrendingDown className="w-6 h-6" />
								Экономия в месяц
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-bold text-primary">
								{formatCurrency(monthlySavings)}
							</p>
						</CardContent>
					</Card>
				</div>

				<Card className="bg-secondary">
					<CardHeader>
						<CardTitle>Информация о партнёре</CardTitle>
						<CardDescription className="text-lg">
							Часть лекарств доступна со скидкой или бесплатно в аптечной сети <strong>xxxxxxxxx</strong>
						</CardDescription>
					</CardHeader>
				</Card>

				<div className="space-y-4">
					<h2 className="text-2xl font-bold">Ваши лекарства</h2>
					{medicines.map((medicine) => (
						<MedicineCard key={medicine.id} medicine={medicine} />
					))}
				</div>

				{medicines.length === 0 && (
					<Card>
						<CardContent className="py-12 text-center">
							<Pill className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
							<p className="text-xl text-muted-foreground">
								У вас пока нет лекарств в аптечке
							</p>
						</CardContent>
					</Card>
				)}
			</div>
		</Layout>
	);
};
