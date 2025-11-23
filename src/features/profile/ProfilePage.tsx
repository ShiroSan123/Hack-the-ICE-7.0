import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/shared/ui/Layout';
import { Button } from '@/shared/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card';
import { useAppStore } from '@/shared/store/useAppStore';
import { formatSnils } from '@/shared/lib/formatters';
import { toast } from 'sonner';
import { profilesApi } from '@/shared/api/profilesApi';
import {
	MessageCircle,
	ShieldCheck,
	LogOut,
	Trash2,
	IdCard,
	FileText,
	HandHeart,
	CheckCircle2,
	Sparkles,
	ListChecks,
	Phone,
	Mail,
	CalendarCheck,
	Circle,
} from 'lucide-react';
import { supabase } from '@/shared/lib/supabaseClient';
import { useAuth } from '@/features/auth/AuthContext';
import type { LucideIcon } from 'lucide-react';
import type { UserProfile } from '@/shared/types/user';
import { cn } from '@/lib/utils';

type DocumentModule = {
	id: 'passport' | 'pension' | 'snils';
	title: string;
	description: string;
	hints: string[];
	helper: string;
	icon: LucideIcon;
	actionLabel?: string;
	actionTarget?: string;
};

const DOCUMENT_MODULES: DocumentModule[] = [
	{
		id: 'passport',
		title: 'Паспорт',
		description: 'Главный документ: серия, номер и кем выдан. Без него никуда.',
		hints: ['Серия и номер в правом верхнем углу', 'Когда и кем выдан документ'],
		helper: 'Держите паспорт рядом — мы подскажем, где какие цифры переписать.',
		icon: IdCard,
		actionLabel: 'Заполнить паспорт',
		actionTarget: 'profile-basic',
	},
	{
		id: 'pension',
		title: 'Пенсионное или справка МСЭ',
		description: 'Подтверждает право на выплаты и бесплатные услуги.',
		hints: ['Номер удостоверения или справки ПФР', 'Дата выдачи и отделение'],
		helper:
			'Если вы пенсионер, подготовьте удостоверение. Для других категорий подойдёт справка об инвалидности или многодетности.',
		icon: HandHeart,
		actionLabel: 'Выбрать категорию',
		actionTarget: 'profile-category',
	},
	{
		id: 'snils',
		title: 'СНИЛС',
		description: 'Понадобится для лекарств, записи к врачу и льготных проездных.',
		hints: ['Всегда 11 цифр без лишних пробелов', 'Мы автоматически поставим дефисы'],
		helper: 'Впишите номер прямо из зелёной карточки — система сама приведёт его к нужному виду.',
		icon: FileText,
		actionLabel: 'Ввести СНИЛС',
		actionTarget: 'profile-documents',
	},
];

type ModuleState = 'ready' | 'missing' | 'optional';

type FormState = {
	name: string;
	region: string;
	category: UserProfile['category'];
	snils: string;
	role: UserProfile['role'];
	simpleModeEnabled: boolean;
	email: string;
	phone: string;
	interests: string[];
};

type SupportStep = {
	id: string;
	title: string;
	description: string;
	targetSection?: string;
	check: (state: FormState) => boolean;
};

type InterestOption = {
	value: string;
	label: string;
	description: string;
};

const CATEGORY_LABELS: Record<UserProfile['category'], string> = {
	pensioner: 'Пенсионер',
	disabled: 'Инвалид',
	veteran: 'Ветеран',
	'large-family': 'Многодетная семья',
	'low-income': 'Малоимущий',
	russia: 'Россия (федеральные льготы)',
};

const INTEREST_OPTIONS: InterestOption[] = [
	{
		value: 'payments',
		label: 'Выплаты и компенсации',
		description: 'ЕДВ, региональные доплаты, субсидии ЖКХ.',
	},
	{
		value: 'medicine',
		label: 'Лекарства и лечение',
		description: 'Бесплатные рецепты, социальные аптеки, реабилитация.',
	},
	{
		value: 'transport',
		label: 'Транспорт и сопровождение',
		description: 'Социальное такси, льготный проезд, сопровождение до МФЦ.',
	},
	{
		value: 'care',
		label: 'Уход и поддержка семьи',
		description: 'Соцработник, сиделка, пансионаты и выплаты ухаживающим.',
	},
];

const SUPPORT_STEPS: SupportStep[] = [
	{
		id: 'contacts',
		title: 'Актуальные контакты',
		description: 'Добавьте телефон или e-mail — оператору будет легче связаться и подтвердить заявку.',
		targetSection: 'profile-contact',
		check: (state) => Boolean(state.phone.trim() || state.email.trim()),
	},
	{
		id: 'snils',
		title: 'СНИЛС для медицины',
		description: '11 цифр понадобятся, чтобы оформить бесплатные лекарства и прикрепиться к поликлинике.',
		targetSection: 'profile-documents',
		check: (state) => state.snils.length === 11,
	},
	{
		id: 'interests',
		title: 'Приоритеты подсказаны',
		description: 'Выберите интересы — мы покажем только нужные льготы и напомнит ассистент.',
		targetSection: 'profile-interests',
		check: (state) => state.interests.length > 0,
	},
	{
		id: 'mode',
		title: 'Простой режим включён',
		description: 'Крупные кнопки, озвучка и контрастность облегчают использование сервисов.',
		targetSection: 'profile-documents',
		check: (state) => state.simpleModeEnabled,
	},
];

// тот же regex, что и в AuthContext / profilesApi
const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const ProfilePage = () => {
	const { user, setUser, logout } = useAppStore();
	const { setManualUser } = useAuth();
	const navigate = useNavigate();
	const [formData, setFormData] = useState<FormState>({
		name: user?.name || '',
		region: user?.region || 'xxxxxxxxx',
		category: user?.category || 'pensioner',
		snils: user?.snils || '',
		role: user?.role || 'self',
		simpleModeEnabled: user?.simpleModeEnabled ?? true,
		email: user?.email || '',
		phone: user?.phone || '',
		interests: user?.interests || [],
	});

	useEffect(() => {
		if (user) {
			setFormData({
				name: user.name || '',
				region: user.region,
				category: user.category,
				snils: user.snils || '',
				role: user.role,
				simpleModeEnabled: user.simpleModeEnabled ?? true,
				email: user.email || '',
				phone: user.phone || '',
				interests: user.interests || [],
			});
		}
	}, [user]);

	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const scrollToSection = useCallback((anchorId: string) => {
		const element = document.getElementById(anchorId);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) return;
		setSaving(true);

		const normalizedEmail = formData.email.trim();
		const normalizedPhone = formData.phone.replace(/\s+/g, '');

		// если профайл не привязан к реальному Supabase-юзеру (нет UUID) —
		// обновляем только локальное состояние, без запросов к БД
		const isRealUser = UUID_REGEX.test(user.authUserId);

		if (!isRealUser) {
			const updatedLocal: UserProfile = {
				...user,
				name: formData.name || undefined,
				email: normalizedEmail || undefined,
				phone: normalizedPhone || undefined,
				region: formData.region,
				category: formData.category,
				snils: formData.snils || undefined,
				role: formData.role,
				interests: formData.interests,
				simpleModeEnabled: formData.simpleModeEnabled,
			};
			setUser(updatedLocal);
			toast.success('Профиль обновлён (без привязки к аккаунту)');
			setSaving(false);
			return;
		}

		try {
			const updated = await profilesApi.updateProfile(user.authUserId, {
				fullName: formData.name,
				email: normalizedEmail || null,
				region: formData.region,
				category: formData.category,
				snils: formData.snils || null,
				role: formData.role,
				interests: formData.interests,
				simpleModeEnabled: formData.simpleModeEnabled,
				phone: normalizedPhone || null,
			});
			setUser(updated);
			toast.success('Профиль успешно обновлён');
		} catch (error) {
			console.error('Profile update error', error);
			toast.error('Не получилось сохранить профиль');
		} finally {
			setSaving(false);
		}
	};

	const handleSnilsChange = (value: string) => {
		const cleaned = value.replace(/\D/g, '').slice(0, 11);
		setFormData({ ...formData, snils: cleaned });
	};

	const handleInterestToggle = (value: string) => {
		setFormData((prev) => {
			const alreadySelected = prev.interests.includes(value);
			return {
				...prev,
				interests: alreadySelected
					? prev.interests.filter((interest) => interest !== value)
					: [...prev.interests, value],
			};
		});
	};

	const handleLogout = async () => {
		try {
			await supabase.auth.signOut();
		} catch (error) {
			console.error('signOut error:', error);
		} finally {
			setManualUser(null);
			logout();
			navigate('/auth');
		}
	};

	const handleDeleteProfile = async () => {
		if (!user) return;
		if (!window.confirm('Удалить профиль и выйти из аккаунта?')) {
			return;
		}
		setDeleting(true);

		const isRealUser = UUID_REGEX.test(user.authUserId);

		try {
			// если это реальный пользователь в Supabase — удаляем профиль в БД
			if (isRealUser) {
				await profilesApi.deleteProfile(user.authUserId);
			}

			await supabase.auth.signOut();
			setManualUser(null);
			logout();
			navigate('/auth', { replace: true });

			toast.success(isRealUser ? 'Профиль удалён' : 'Локальный профиль удалён');
		} catch (error) {
			console.error('Profile delete error', error);
			toast.error('Не удалось удалить профиль');
		} finally {
			setDeleting(false);
		}
	};

	const resolveModuleState = (moduleId: DocumentModule['id']): ModuleState => {
		if (moduleId === 'passport') {
			return formData.name && formData.region ? 'ready' : 'missing';
		}

		if (moduleId === 'pension') {
			return formData.category === 'pensioner' ? 'ready' : 'optional';
		}

		if (moduleId === 'snils') {
			return formData.snils.length === 11 ? 'ready' : 'missing';
		}

		return 'optional';
	};

	const documentStats = DOCUMENT_MODULES.reduce(
		(acc, module) => {
			const state = resolveModuleState(module.id);
			if (state !== 'optional') {
				acc.total += 1;
				if (state === 'ready') {
					acc.ready += 1;
				}
			}
			return acc;
		},
		{ ready: 0, total: 0 }
	);

	const completionChecklist = [
		{
			id: 'identity',
			label: 'Паспортные данные',
			description: 'Имя и регион совпадают с документами',
			done: Boolean(formData.name.trim() && formData.region.trim()),
		},
		{
			id: 'category',
			label: 'Категория подтверждена',
			description: CATEGORY_LABELS[formData.category] ? `Вы выбрали: ${CATEGORY_LABELS[formData.category]}` : 'Выберите категорию, чтобы подсказать льготы',
			done: Boolean(formData.category),
		},
		{
			id: 'contacts',
			label: 'Связь с вами',
			description: 'Телефон или e-mail указаны для уведомлений',
			done: Boolean(formData.phone.trim() || formData.email.trim()),
		},
		{
			id: 'documents',
			label: 'Документы готовы',
			description: `${documentStats.ready}/${documentStats.total || DOCUMENT_MODULES.length} обязательных модулей заполнено`,
			done: documentStats.total > 0 && documentStats.ready === documentStats.total,
		},
		{
			id: 'interests',
			label: 'Приоритеты понятны',
			description: formData.interests.length
				? `${formData.interests.length} тем выбрано`
				: 'Отметьте темы, чтобы ассистент подсказывал точнее',
			done: formData.interests.length > 0,
		},
	];

	const completionPercent = completionChecklist.length
		? Math.min(
			100,
			Math.round(
				(completionChecklist.filter((item) => item.done).length /
					completionChecklist.length) * 100
			)
		)
		: 0;

	const contactPreview = formData.phone.trim() || formData.email.trim() || 'Не указано';
	const phonePreview = formData.phone.trim() || 'Не указан';
	const emailPreview = formData.email.trim() || 'Не указана';
	const interestRowValue = formData.interests.length
		? `${formData.interests.length} тем выбрано`
		: 'Не выбрано';
	const interestCountLabel = formData.interests.length
		? `${formData.interests.length} тем`
		: '0 тем';
	const categoryLabel = CATEGORY_LABELS[formData.category] || 'Категория не выбрана';
	const nextSteps = SUPPORT_STEPS.map((step) => ({
		...step,
		done: step.check(formData),
	}));

	return (
		<Layout title="Профиль и настройки">
			<div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
				<div className="space-y-6">
					<Card className="rounded-3xl border-none bg-gradient-to-br from-primary via-primary/90 to-accent/80 text-white shadow-xl">
						<CardHeader className="space-y-3">
							<CardTitle className="flex items-center gap-2 text-2xl md:text-3xl">
								<Sparkles className="w-5 h-5" />Ваш профиль готов на {completionPercent}%
							</CardTitle>
							<CardDescription className="text-white/90">
								Заполните ключевые данные один раз — сервис сам подскажет льготы, сформирует отчёт для печати и предупредит, что ещё нужно собрать.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6 text-white">
							<div className="h-3 rounded-full bg-white/30">
								<div
									className="h-full rounded-full bg-white shadow"
									style={{ width: `${completionPercent}%` }}
								/>
							</div>
							<div className="grid gap-3 md:grid-cols-2">
								{completionChecklist.map((item) => (
									<div key={item.id} className="flex items-start gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur">
										{item.done ? (
											<CheckCircle2 className="w-5 h-5 text-emerald-300" />
										) : (
											<Circle className="w-5 h-5 text-white/50" />
										)}
										<div>
											<p className="text-sm font-semibold">{item.label}</p>
											<p className="text-xs text-white/80">{item.description}</p>
										</div>
									</div>
								))}
							</div>
							<div className="grid gap-3 md:grid-cols-3 text-sm">
								<div className="rounded-2xl bg-white/10 p-3">
									<p className="text-white/70">Регион</p>
									<p className="text-base font-semibold">{formData.region || 'Не указан'}</p>
								</div>
								<div className="rounded-2xl bg-white/10 p-3">
									<p className="text-white/70">Категория</p>
									<p className="text-base font-semibold">{categoryLabel}</p>
								</div>
								<div className="rounded-2xl bg-white/10 p-3">
									<p className="text-white/70">Связь</p>
									<p className="text-base font-semibold">{contactPreview}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="rounded-3xl border border-primary/20 bg-white">
						<CardHeader>
							<CardTitle>Документы для получения льгот</CardTitle>
							<CardDescription>
								Готовность {documentStats.ready}/{documentStats.total || DOCUMENT_MODULES.length}. Собрали всё модулями: паспорт, подтверждение категории и СНИЛС. Просто держите их рядом и отмечайте, что готово.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								{DOCUMENT_MODULES.map((module) => {
									const Icon = module.icon;
									const state = resolveModuleState(module.id);
									const stateMeta = MODULE_STATE_META[state];

									return (
										<div key={module.id} className="rounded-3xl border border-border/70 bg-muted/30 p-4 space-y-4">
											<div className="flex items-start justify-between gap-3">
												<div className="flex items-center gap-3">
													<div className="rounded-2xl bg-primary/10 text-primary p-2">
														<Icon className="w-5 h-5" />
													</div>
													<div>
														<p className="text-base font-semibold text-foreground">{module.title}</p>
														<p className="text-sm text-muted-foreground">{module.description}</p>
													</div>
												</div>
												<span
													className={`text-xs font-semibold rounded-2xl border px-3 py-1 ${stateMeta.badgeClass}`}
												>
													{stateMeta.label}
												</span>
											</div>

											<ul className="space-y-2 text-sm text-muted-foreground">
												{module.hints.map((hint) => (
													<li key={hint} className="flex items-center gap-2">
														<CheckCircle2 className="w-4 h-4 text-primary" />
														<span>{hint}</span>
													</li>
												))}
											</ul>

											<p className="text-sm font-medium text-foreground">{module.helper}</p>
											{module.actionLabel && module.actionTarget && (
												<Button
													type="button"
													variant="outline"
													size="sm"
													className="w-full"
													onClick={() => scrollToSection(module.actionTarget ?? '')}
												>
													{module.actionLabel}
												</Button>
											)}
										</div>
									);
								})}
							</div>
							<p className="text-sm text-muted-foreground">
								Нет документа под рукой? Заполните то, что знаете, сохраните профиль и вернитесь к остальному позже — информация не потеряется.
							</p>
						</CardContent>
					</Card>

					<Card className="rounded-3xl">
						<CardHeader>
							<CardTitle>Расскажите о себе и настройках</CardTitle>
							<CardDescription>
								Поля простые: как в паспорте и справках. Чем подробнее профиль, тем точнее подсказки и письма от ассистента.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-8">
								<section id="profile-basic" className="space-y-3">
									<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Основное</p>
									<div className="grid gap-4 md:grid-cols-2">
										<label className="space-y-2">
											<span className="text-sm font-semibold">Имя и фамилия</span>
											<input
												type="text"
												value={formData.name}
												onChange={(e) => setFormData({ ...formData, name: e.target.value })}
												className="w-full h-12 rounded-2xl border-2 border-input bg-background px-4 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
												placeholder="Например, Мария Иванова"
												required
											/>
											<p className="text-xs text-muted-foreground">Запишите так же, как в паспорте.</p>
										</label>

										<label className="space-y-2">
											<span className="text-sm font-semibold">Регион проживания</span>
											<input
												type="text"
												value={formData.region}
												onChange={(e) => setFormData({ ...formData, region: e.target.value })}
												className="w-full h-12 rounded-2xl border-2 border-input bg-background px-4 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
												required
											/>
											<p className="text-xs text-muted-foreground">Например, «Москва», «Сахалинская область».</p>
										</label>
									</div>
								</section>

								<section id="profile-category" className="space-y-3">
									<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Льготная категория</p>
									<div className="grid gap-4 md:grid-cols-2">
										<label className="space-y-2">
											<span className="text-sm font-semibold">К кому вы относитесь</span>
											<select
												value={formData.category}
												onChange={(e) =>
													setFormData({
														...formData,
														category: e.target.value as UserProfile['category'],
													})
												}
												className="w-full h-12 rounded-2xl border-2 border-input bg-background px-4 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
												required
												>
													<option value="pensioner">Пенсионер</option>
													<option value="disabled">Инвалид</option>
													<option value="veteran">Ветеран</option>
													<option value="large-family">Многодетная семья</option>
													<option value="low-income">Малоимущий</option>
													<option value="russia">Россия (федеральные льготы)</option>
												</select>
											<p className="text-xs text-muted-foreground">Так мы подскажем, что важно принести в МФЦ.</p>
										</label>

										<label className="space-y-2">
											<span className="text-sm font-semibold">Кто пользуется сервисом</span>
											<select
												value={formData.role}
												onChange={(e) =>
													setFormData({
														...formData,
														role: e.target.value as UserProfile['role'],
													})
												}
												className="w-full h-12 rounded-2xl border-2 border-input bg-background px-4 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
												required
											>
												<option value="self">Использую для себя</option>
												<option value="relative">Помогаю родственнику</option>
											</select>
											<p className="text-xs text-muted-foreground">Так мы покажем подсказки и для вас, и для того, кому помогаете.</p>
										</label>
									</div>
								</section>

								<section id="profile-contact" className="space-y-3">
									<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Контакты</p>
									<div className="grid gap-4 md:grid-cols-2">
										<label className="space-y-2">
											<span className="text-sm font-semibold">Телефон</span>
											<input
												type="tel"
												value={formData.phone}
												onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
												className="w-full h-12 rounded-2xl border-2 border-input bg-background px-4 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
												placeholder="+7 999 123-45-67"
											/>
											<p className="text-xs text-muted-foreground">Укажем его в письмах и напоминаниях.</p>
										</label>

										<label className="space-y-2">
											<span className="text-sm font-semibold">Электронная почта</span>
											<input
												type="email"
												value={formData.email}
												onChange={(e) => setFormData({ ...formData, email: e.target.value })}
												className="w-full h-12 rounded-2xl border-2 border-input bg-background px-4 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
												placeholder="example@mail.ru"
											/>
											<p className="text-xs text-muted-foreground">Чтобы отправлять вам инструкции и квитанции.</p>
										</label>
									</div>
								</section>

								<section id="profile-interests" className="space-y-3">
									<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Что важно подсказать</p>
									<div className="grid gap-3 md:grid-cols-2">
										{INTEREST_OPTIONS.map((interest) => {
											const selected = formData.interests.includes(interest.value);
											return (
												<button
													key={interest.value}
													type="button"
													onClick={() => handleInterestToggle(interest.value)}
													className={cn(
														'rounded-2xl border-2 p-4 text-left transition-all',
														selected
															? 'border-primary bg-primary/10 text-primary shadow-sm'
															: 'border-border hover:border-primary/50'
													)}
												>
													<p className="text-sm font-semibold">{interest.label}</p>
													<p className="text-xs text-muted-foreground">{interest.description}</p>
												</button>
											);
										})}
									</div>
									<p className="text-xs text-muted-foreground">Отмеченные темы попадут в подсказки чат-бота и в печатный отчёт.</p>
								</section>

								<section className="space-y-3" id="profile-documents">
									<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Документы и режим</p>
									<div className="grid gap-4 md:grid-cols-2">
										<label className="space-y-2" id="profile-snils">
											<span className="text-sm font-semibold">СНИЛС</span>
											<input
												type="text"
												value={formatSnils(formData.snils)}
												onChange={(e) => handleSnilsChange(e.target.value)}
												className="w-full h-12 rounded-2xl border-2 border-input bg-background px-4 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
												placeholder="___-___-___ __"
												maxLength={14}
											/>
											<p className="text-xs text-muted-foreground">Если нет под рукой — оставьте пустым, добавите позже.</p>
										</label>

										<div className="space-y-2">
											<span className="text-sm font-semibold">Упрощённый режим</span>
											<div className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
												<input
													type="checkbox"
													id="simpleMode"
													checked={formData.simpleModeEnabled}
													onChange={(e) => setFormData({ ...formData, simpleModeEnabled: e.target.checked })}
													className="h-5 w-5 rounded border-2 border-primary"
												/>
												<label htmlFor="simpleMode" className="text-base">
													Большие кнопки, озвучка и простая навигация
												</label>
											</div>
											<p className="text-xs text-muted-foreground">Подходит тем, кто только осваивает смартфон.</p>
										</div>
									</div>
								</section>

								<Button type="submit" size="lg" className="w-full" disabled={saving}>
									{saving ? 'Сохраняем...' : 'Сохранить изменения'}
								</Button>
							</form>
						</CardContent>
					</Card>
				</div>

				<div className="space-y-4">
					<Card className="rounded-3xl">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ListChecks className="w-5 h-5 text-primary" />Личный план
							</CardTitle>
							<CardDescription>Что ещё можно подготовить перед визитом в МФЦ или звонком оператору.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{nextSteps.map((step) => (
								<div key={step.id} className="flex flex-col gap-2 rounded-2xl border border-border/80 p-4">
									<div className="flex items-start gap-3">
										{step.done ? (
											<CheckCircle2 className="w-5 h-5 text-emerald-500" />
										) : (
											<Circle className="w-5 h-5 text-muted-foreground" />
										)}
										<div>
											<p className="text-sm font-semibold text-foreground">{step.title}</p>
											<p className="text-xs text-muted-foreground">{step.description}</p>
										</div>
									</div>
									{step.targetSection && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											className="self-start"
											onClick={() => scrollToSection(step.targetSection ?? '')}
										>
											{step.done ? 'Посмотреть' : 'Заполнить'}
										</Button>
									)}
								</div>
							))}
						</CardContent>
					</Card>

					<Card className="rounded-3xl">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Sparkles className="w-5 h-5 text-primary" />Профиль под рукой
							</CardTitle>
							<CardDescription>Эти данные уже попадут в чат-бота, печать и подсказки оператору.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-3 text-sm">
								<div className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
									<Phone className="w-4 h-4 text-primary" />
									<div>
										<p className="text-xs text-muted-foreground">Телефон</p>
										<p className="text-base font-semibold">{phonePreview}</p>
									</div>
								</div>
								<div className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
									<Mail className="w-4 h-4 text-primary" />
									<div>
										<p className="text-xs text-muted-foreground">Почта</p>
										<p className="text-base font-semibold">{emailPreview}</p>
									</div>
								</div>
								<div className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
									<ListChecks className="w-4 h-4 text-primary" />
									<div>
										<p className="text-xs text-muted-foreground">Интересы</p>
										<p className="text-base font-semibold">{interestRowValue}</p>
									</div>
								</div>
							</div>
							<div className="rounded-2xl border border-dashed border-primary/40 px-4 py-3 text-sm flex items-start gap-3">
								<CalendarCheck className="w-4 h-4 text-primary mt-1" />
								<div>
									<p className="text-sm font-semibold text-foreground">Готовый комплект для МФЦ</p>
									<p className="text-xs text-muted-foreground">
										QR включает {interestCountLabel}, выбранную категорию и ваши контакты — просто распечатайте и возьмите с собой.
									</p>
								</div>
							</div>
							<Button variant="outline" size="lg" asChild className="w-full">
								<Link to="/print">Печатать QR с профилем</Link>
							</Button>
						</CardContent>
					</Card>

					<Card className="rounded-3xl">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<MessageCircle className="w-5 h-5 text-primary" />Нужна помощь?
							</CardTitle>
							<CardDescription>
								Горячая линия 122 или чат-бот подскажут шаги и документы. Мы передадим оператору только то, что вы сохранили в профиле.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<Button variant="accent" size="lg" asChild className="w-full">
								<Link to="/assistant">Открыть чат-бота</Link>
							</Button>
							<div className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
								<ShieldCheck className="w-4 h-4 text-primary" />
								Ваши данные остаются только здесь и нужны, чтобы подсказать подходящие льготы.
							</div>
						</CardContent>
					</Card>

					<Card className="rounded-3xl space-y-4">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<LogOut className="w-5 h-5" />Аккаунт
							</CardTitle>
							<CardDescription>Можно выйти или полностью удалить профиль.</CardDescription>
						</CardHeader>
						<CardContent>
							<Button variant="outline" size="lg" className="w-full" onClick={handleLogout}>
								Выйти из профиля
							</Button>
						</CardContent>
						<CardContent>
							<Button
								variant="destructive"
								size="lg"
								className="w-full"
								onClick={handleDeleteProfile}
								disabled={deleting}
							>
								<Trash2 className="w-4 h-4" />
								{deleting ? 'Удаляем...' : 'Удалить профиль'}
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</Layout>
	);
};

const MODULE_STATE_META: Record<ModuleState, { label: string; badgeClass: string }> = {
	ready: {
		label: 'Готово',
		badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
	},
	missing: {
		label: 'Нужно заполнить',
		badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
	},
	optional: {
		label: 'Не обязательно',
		badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
	},
};
