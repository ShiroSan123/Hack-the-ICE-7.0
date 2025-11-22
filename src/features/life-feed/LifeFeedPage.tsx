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
import {
	Volume2,
	Sparkles,
	AlertCircle,
	ShoppingBag,
	Pill,
	CalendarDays,
	Headset,
	ShieldCheck,
	ChevronRight,
} from 'lucide-react';
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
		setLoading(true);
		const loadData = async () => {
			try {
				const [benefitsData, offersData, medicinesData] = await Promise.all([
					benefitsApi.getForProfile(user),
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
	}, [user, setBenefits, setOffers, setMedicines]);

	const accessibleBenefits = useMemo(() => {
		if (!user) return benefits;
		return benefits.filter(
			(benefit: Benefit) =>
				benefit.targetGroups.includes(user.category) &&
				(benefit.regions.includes(user.region) || benefit.regions.includes('all'))
		);
	}, [benefits, user]);

	const newBenefits = accessibleBenefits.filter((b: Benefit) => b.isNew).slice(0, 3);
	const expiringBenefits = accessibleBenefits
		.filter((b: Benefit) => b.expiresIn && b.expiresIn < 90)
		.slice(0, 3);
	const userOffers = user
		? offers
			.filter((o: Offer) =>
				o.targetGroups.includes(user.category) && o.regions.includes(user.region)
			)
			.slice(0, 3)
		: offers.slice(0, 3);

	const urgentCount = expiringBenefits.length;
	const newCount = newBenefits.length;
	const medsCount = medicines.length;

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
			<Layout title="Мой путь к поддержке">
				<div className="text-center py-12">
					<p className="text-xl">Загрузка...</p>
				</div>
			</Layout>
		);
	}

	return (
		<Layout title="Мой путь к поддержке">
			<div className="space-y-8">
				<div className="grid gap-4 lg:grid-cols-[3fr,2fr]">
					<section className="rounded-3xl bg-white p-6 md:p-8 shadow-sm relative overflow-hidden">
						<div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent" aria-hidden />
						<div className="relative space-y-6">
							<div className="space-y-2">
								<p className="text-sm uppercase tracking-[0.3em] text-primary/80">Основной режим</p>
								<h2 className="text-3xl font-bold leading-tight">
									{user ? `Здравствуйте, ${user.name || 'пользователь'}!` : 'Добро пожаловать в Поддержка++'}
								</h2>
								<p className="text-lg text-muted-foreground">
									Следим за льготами, скидками и лекарствами вашего региона, чтобы вы не пропустили помощь.
								</p>
							</div>
							<div className="grid sm:grid-cols-3 gap-4">
								<div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
									<p className="text-sm text-muted-foreground">Новых льгот</p>
									<p className="text-3xl font-bold text-primary">{newCount}</p>
								</div>
								<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
									<p className="text-sm text-muted-foreground">Истекают скоро</p>
									<p className="text-3xl font-bold text-amber-600">{urgentCount}</p>
								</div>
								<div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
									<p className="text-sm text-muted-foreground">Лекарств в аптечке</p>
									<p className="text-3xl font-bold text-emerald-600">{medsCount}</p>
								</div>
							</div>
							<div className="flex flex-wrap gap-3">
								<Button variant="accent" size="lg" asChild>
									<Link to="/benefits">Посмотреть льготы</Link>
								</Button>
								<Button variant="outline" size="lg" asChild>
									<Link to="/assistant">Спросить ассистента</Link>
								</Button>
								<Button variant="ghost" size="lg" asChild>
									<Link to="/simple">Простой режим</Link>
								</Button>
							</div>
						</div>
					</section>

					<section className="rounded-3xl bg-gradient-to-br from-slate-900 via-primary/80 to-primary text-primary-foreground p-6 md:p-8 flex flex-col gap-6">
						<div>
							<p className="text-sm uppercase tracking-[0.4em] text-white/70">Что важно</p>
							<h3 className="text-2xl font-semibold leading-tight">Контроль сроков и документов</h3>
							<p className="text-base text-white/90 mt-2">
								Мы уже собрали для вас ключевые шаги и документы. Если что-то нужно озвучить или подсказать — нажмите кнопку «Ассистент».
							</p>
						</div>
						<ul className="space-y-3 text-sm text-white/90">
							<li className="flex items-center gap-3">
								<CalendarDays className="w-5 h-5" />
								{urgentCount > 0
									? `У ${urgentCount} выплат истекает срок. Успейте обновить заявление.`
									: 'Ни одна льгота не требует срочных действий'}
							</li>
							<li className="flex items-center gap-3">
								<ShieldCheck className="w-5 h-5" />
								Проверены требования региона {user?.region || 'вашего региона'}
							</li>
							<li className="flex items-center gap-3">
								<Headset className="w-5 h-5" />
								Горячая линия 122 подскажет, если понадобится бумажный пакет
							</li>
						</ul>
						<Button variant="secondary" size="lg" asChild className="self-start text-slate-900">
							<Link to="/print">Сформировать памятку</Link>
						</Button>
					</section>
				</div>

				<PriorityStack cards={priorityCards} />

				<div className="grid gap-6 lg:grid-cols-3">
					<Card className="lg:col-span-2">
						<CardHeader className="flex flex-col gap-1">
							<CardTitle className="flex items-center gap-2">
								<Sparkles className="w-6 h-6 text-accent" />
								Новые возможности
							</CardTitle>
							<CardDescription>
								Мы нашли льготы и скидки, которые недавно стали доступны в вашем профиле.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{newBenefits.length === 0 && (
								<p className="text-muted-foreground">Пока нет новых льгот. Загляните позже или уточните категорию в профиле.</p>
							)}
							{newBenefits.map((benefit: Benefit) => (
								<article key={benefit.id} className="rounded-2xl border border-accent/40 bg-accent/5 p-4">
									<div className="flex flex-col gap-3">
										<div>
											<p className="text-xs uppercase tracking-[0.3em] text-accent">Новое</p>
											<h3 className="text-xl font-semibold">{benefit.title}</h3>
											<p className="text-base text-muted-foreground">{benefit.description}</p>
										</div>
										<div className="flex flex-wrap gap-3">
											{benefit.savingsPerMonth && (
												<span className="rounded-full bg-white/70 px-3 py-1 text-sm font-semibold text-primary">
													Экономия {formatCurrency(benefit.savingsPerMonth)}/мес
												</span>
											)}
											<Button variant="accent" size="sm" asChild>
												<Link to={`/benefits/${benefit.id}`}>Открыть</Link>
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleSpeak(`${benefit.title}. ${benefit.description}`)}
												disabled={speaking}
											>
												<Volume2 className="w-4 h-4" />
												Озвучить
											</Button>
										</div>
									</div>
								</article>
							))}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<AlertCircle className="w-6 h-6 text-destructive" />
								Не упустите сроки
							</CardTitle>
							<CardDescription>
								Льготы, которые нужно обновить в ближайшие недели.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{expiringBenefits.length === 0 && (
								<p className="text-muted-foreground">Нет льгот со скорым истечением.</p>
							)}
							{expiringBenefits.map((benefit: Benefit) => (
								<div key={benefit.id} className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="text-sm font-semibold">{benefit.title}</p>
											<p className="text-sm text-muted-foreground">{benefit.description}</p>
										</div>
										<div className="text-right text-destructive text-sm font-semibold">
											{benefit.expiresIn} дн.
										</div>
									</div>
									<Button variant="link" size="sm" asChild className="px-0 text-destructive" >
										<Link to={`/benefits/${benefit.id}`}>Что сделать</Link>
									</Button>
								</div>
							))}
						</CardContent>
					</Card>
				</div>

				<div className="grid gap-6 lg:grid-cols-3">
					<Card className="lg:col-span-2">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ShoppingBag className="w-6 h-6 text-primary" />
								Персональные предложения
							</CardTitle>
							<CardDescription>Скидки и акции от партнёров вашего региона.</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-3 md:grid-cols-2">
							{userOffers.length === 0 && (
								<p className="text-muted-foreground">Нет доступных скидок. Проверьте профиль, чтобы добавить интересы.</p>
							)}
							{userOffers.map((offer: Offer) => (
								<article key={offer.id} className="rounded-2xl border p-4 flex flex-col gap-3">
									<div className="flex items-start justify-between gap-3">
										<div>
											<h3 className="text-lg font-semibold">{offer.partner}</h3>
											<p className="text-sm text-muted-foreground">{offer.title}</p>
										</div>
										<span className="text-2xl font-bold text-primary">-{offer.discount}%</span>
									</div>
									<p className="text-sm text-muted-foreground">{offer.description}</p>
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleSpeak(`${offer.title}. ${offer.description}`)}
										disabled={speaking}
									>
										<Volume2 className="w-4 h-4" />
										Озвучить
									</Button>
								</article>
							))}
						</CardContent>
					</Card>

					<Card className="bg-secondary">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Pill className="w-6 h-6" />
								Ваша аптечка
							</CardTitle>
							<CardDescription>Следим за расходами на лекарства и скидками.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<p className="text-3xl font-bold text-primary">{medsCount} препаратов</p>
							<Button variant="accent" size="lg" asChild className="w-full">
								<Link to="/apteka">Открыть аптечку</Link>
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Headset className="w-6 h-6 text-primary" />
								Поддержка рядом
							</CardTitle>
							<CardDescription>Канал связи и быстрые действия.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
								<p className="text-sm font-semibold">Горячая линия 122</p>
								<p className="text-sm text-muted-foreground">Скажите оператору код вашего региона {user?.region || 'xxxxxxxxx'}.</p>
							</div>
							<Button variant="outline" size="lg" asChild className="w-full">
								<Link to="/assistant">Перейти в чат-бот</Link>
							</Button>
							<Button variant="ghost" size="lg" asChild className="w-full text-primary">
								<Link to="/simple" className="flex items-center justify-center gap-2">
									<ChevronRight className="w-4 h-4" />
									Упрощённый режим
								</Link>
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</Layout>
	);
};
