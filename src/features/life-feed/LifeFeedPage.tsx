import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/shared/ui/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { useAppStore } from '@/shared/store/useAppStore';
import { benefitsApi } from '@/shared/api/benefitsApi';
import { offersApi } from '@/shared/api/offersApi';
import { medicinesApi } from '@/shared/api/medicinesApi';
import { Benefit, Offer } from '@/shared/types';
import { Link } from 'react-router-dom';
import { Volume2, Sparkles, AlertCircle, ShoppingBag, Pill } from 'lucide-react';
import { useTTS } from '@/shared/lib/useTTS';
import { formatCurrency } from '@/shared/lib/formatters';
import { PriorityStack, PriorityCardData } from './PriorityStack';

export const LifeFeedPage = () => {
	const {
		benefits,
		setBenefits,
		offers,
		setOffers,
		user,
		medicines,
		setMedicines,
	} = useAppStore();
	const [loading, setLoading] = useState(true);
	const { speak, speaking } = useTTS();

	useEffect(() => {
		const loadData = async () => {
			try {
				const [benefitsData, offersData, medicinesData] = await Promise.all([
					benefitsApi.getAll(),
					offersApi.getAll(),
					medicinesApi.getAll(),
				]);
				setBenefits(benefitsData);
				setOffers(offersData);
				setMedicines(medicinesData);
			} catch (error) {
				console.error('Failed to load data:', error);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [setBenefits, setOffers, setMedicines]);

	const newBenefits = benefits.filter((b: Benefit) => b.isNew).slice(0, 3);
	const expiringBenefits = benefits
		.filter((b: Benefit) => b.expiresIn && b.expiresIn < 90)
		.slice(0, 3);
	const userOffers = user
		? offers.filter((o: Offer) =>
			o.targetGroups.includes(user.category) && o.regions.includes(user.region)
		).slice(0, 3)
		: [];

	const handleSpeak = (text: string) => {
		speak(text);
	};

	const priorityCards = useMemo<PriorityCardData[]>(() => {
		const cards: PriorityCardData[] = [];

		const medsCount = medicines.length;
		const medsWord =
			medsCount === 1
				? 'лекарство'
				: medsCount > 1 && medsCount < 5
					? 'лекарства'
					: 'лекарств';

		const medicineOffer = offers.find((offer) => {
			if (offer.category !== 'Медицина') return false;
			if (!user) return true;
			return (
				offer.targetGroups.includes(user.category) &&
				offer.regions.includes(user.region)
			);
		});

		if (medsCount > 0) {
			const expensiveMed = medicines.reduce(
				(top, med) => (med.monthlyPrice > top.monthlyPrice ? med : top),
				medicines[0]
			);
			const pharmacyName = medicineOffer?.partner ?? 'ближайшая аптека';

			const estimatedDiscount =
				expensiveMed.discountedPrice ??
				Math.max(
					expensiveMed.monthlyPrice -
					Math.round(
						(expensiveMed.monthlyPrice * (medicineOffer?.discount ?? 0)) / 100
					),
					0
				);

			const saved = Math.max(expensiveMed.monthlyPrice - estimatedDiscount, 0);

			cards.push({
				id: 'pharmacy',
				badge: 'Аптека рядом',
				title: `${expensiveMed.name} со скидкой`,
				description: `У вас ${medsCount} ${medsWord}. В 100 м ${pharmacyName} выдаёт ${expensiveMed.name} дешевле на ~${formatCurrency(saved)} в месяц.`,
				accent: 'from-emerald-500 via-teal-500 to-sky-500',
				icon: <Pill className="w-10 h-10" />,
				action: {
					label: 'Открыть аптечку',
					to: '/apteka',
				},
			});
		}

		const availableBenefits = user
			? benefits.filter(
				(benefit) =>
					benefit.targetGroups.includes(user.category) &&
					benefit.regions.includes(user.region)
			)
			: benefits;

		const urgentBenefit = availableBenefits
			.filter((benefit) => typeof benefit.expiresIn === 'number')
			.sort(
				(a, b) => (a.expiresIn ?? Number.MAX_SAFE_INTEGER) - (b.expiresIn ?? Number.MAX_SAFE_INTEGER)
			)[0];

		if (urgentBenefit && typeof urgentBenefit.expiresIn === 'number') {
			cards.push({
				id: `urgent-${urgentBenefit.id}`,
				badge: 'Срочно',
				title: urgentBenefit.title,
				description: `Льгота заканчивается через ${urgentBenefit.expiresIn} дней. Сделайте шаги сейчас, чтобы не потерять выплату.`,
				accent: 'from-orange-500 via-red-500 to-rose-500',
				icon: <AlertCircle className="w-10 h-10" />,
				action: {
					label: 'Подробнее',
					to: `/benefits/${urgentBenefit.id}`,
				},
			});
		}

		const freshBenefit = availableBenefits.find((benefit) => benefit.isNew);
		if (freshBenefit) {
			cards.push({
				id: `new-${freshBenefit.id}`,
				badge: 'Новое для вас',
				title: freshBenefit.title,
				description: `Льгота доступна в вашем регионе. Средняя экономия ${freshBenefit.savingsPerMonth
					? formatCurrency(freshBenefit.savingsPerMonth)
					: 'до 30%'} в месяц.`,
				accent: 'from-purple-600 via-indigo-500 to-blue-500',
				icon: <Sparkles className="w-10 h-10" />,
				action: {
					label: 'Открыть льготу',
					to: `/benefits/${freshBenefit.id}`,
				},
			});
		}

		if (cards.length === 0) {
			cards.push({
				id: 'profile',
				badge: 'Персонализация',
				title: 'Заполните профиль',
				description:
					'Добавьте информацию о себе и лекарства, чтобы получать подсказки и скидки.',
				accent: 'from-slate-600 via-gray-700 to-gray-900',
				icon: <Sparkles className="w-10 h-10" />,
				action: {
					label: 'Перейти в профиль',
					to: '/profile',
				},
			});
		}

		return cards;
	}, [benefits, medicines, offers, user]);

	if (loading) {
		return (
			<Layout title="Лента новостей">
				<div className="text-center py-12">
					<p className="text-xl">Загрузка...</p>
				</div>
			</Layout>
		);
	}

	return (
		<Layout title="Лента новостей">
			<div className="space-y-6">
				<PriorityStack cards={priorityCards} />

				{user && (
					<Card className="bg-primary/5 border-primary/20">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Sparkles className="w-6 h-6 text-primary" />
								Добро пожаловать, {user.name || 'Пользователь'}!
							</CardTitle>
							<CardDescription className="text-lg">
								Регион: {user.region} • Категория: {user.category}
							</CardDescription>
						</CardHeader>
					</Card>
				)}

				{newBenefits.length > 0 && (
					<section>
						<h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
							<Sparkles className="w-7 h-7 text-accent" />
							Новые льготы
						</h2>
						<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
							{newBenefits.map((benefit: Benefit) => (
								<Card key={benefit.id} className="border-accent">
									<CardHeader>
										<CardTitle className="text-xl">{benefit.title}</CardTitle>
										<CardDescription>{benefit.description}</CardDescription>
									</CardHeader>
									<CardContent className="space-y-3">
										{benefit.savingsPerMonth && (
											<p className="text-primary font-semibold">
												Экономия: {formatCurrency(benefit.savingsPerMonth)}/мес
											</p>
										)}
										<div className="flex gap-2">
											<Button variant="default" size="default" asChild className="flex-1">
												<Link to={`/benefits/${benefit.id}`}>Подробнее</Link>
											</Button>
											<Button
												variant="outline"
												size="default"
												onClick={() => handleSpeak(benefit.title + '. ' + benefit.description)}
												disabled={speaking}
											>
												<Volume2 className="w-5 h-5" />
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</section>
				)}

				{expiringBenefits.length > 0 && (
					<section>
						<h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
							<AlertCircle className="w-7 h-7 text-destructive" />
							Истекающие льготы
						</h2>
						<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
							{expiringBenefits.map((benefit: Benefit) => (
								<Card key={benefit.id} className="border-destructive">
									<CardHeader>
										<CardTitle className="text-xl">{benefit.title}</CardTitle>
										<CardDescription>{benefit.description}</CardDescription>
										<div className="flex items-center gap-2 text-destructive font-medium">
											<AlertCircle className="w-5 h-5" />
											Истекает через {benefit.expiresIn} дней
										</div>
									</CardHeader>
									<CardContent>
										<Button variant="default" size="default" asChild className="w-full">
											<Link to={`/benefits/${benefit.id}`}>Подробнее</Link>
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					</section>
				)}

				{userOffers.length > 0 && (
					<section>
						<h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
							<ShoppingBag className="w-7 h-7 text-primary" />
							Скидки от партнёров
						</h2>
						<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
							{userOffers.map((offer: Offer) => (
								<Card key={offer.id}>
									<CardHeader>
										<CardTitle className="text-xl">{offer.title}</CardTitle>
										<CardDescription>{offer.description}</CardDescription>
										<div className="flex items-center gap-2">
											<span className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm font-bold">
												{offer.discount}%
											</span>
											<span className="text-sm text-muted-foreground">
												{offer.partner}
											</span>
										</div>
									</CardHeader>
									<CardContent>
										<Button
											variant="outline"
											size="default"
											onClick={() => handleSpeak(offer.title + '. ' + offer.description)}
											disabled={speaking}
											className="w-full"
										>
											<Volume2 className="w-5 h-5 mr-2" />
											Озвучить
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					</section>
				)}

				<Card className="bg-secondary">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Pill className="w-6 h-6" />
							Ваша аптечка
						</CardTitle>
						<CardDescription className="text-lg">
							Отслеживайте лекарства и экономьте на покупках
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button variant="accent" size="lg" asChild>
							<Link to="/apteka">Перейти в аптечку</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		</Layout>
	);
};
