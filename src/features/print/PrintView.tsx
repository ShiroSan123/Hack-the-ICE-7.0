import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/shared/ui/Button';
import { useAppStore } from '@/shared/store/useAppStore';
import { requestOtpCode, type OtpRequestResponse } from '@/shared/api/otpClient';
import { normalizePhoneToE164, isValidPhone } from '@/shared/lib/phone';
import { useAuth } from '@/features/auth/AuthContext';
import {
	Printer,
	ArrowLeft,
	Download,
	ClipboardList,
	FileText,
	Pill,
	ShieldCheck,
	CheckCircle2,
	QrCode,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatCurrency } from '@/shared/lib/formatters';
import { normalizeTargetGroup } from '@/shared/lib/targetGroups';
import type { Benefit } from '@/shared/types';

type PrintQrResult = OtpRequestResponse & {
	normalizedPhone: string;
	requestedAt: string;
	expiresAt: string | null;
};

type ParsedQrPayload = {
	requestId?: string;
	phone?: string;
	provider?: string;
	brand?: string;
	generatedAt?: string;
};

const formatDetailedDate = (value: string | null) => {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return '—';
	}

	return date.toLocaleString('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});
};

export const PrintView = () => {
	const { benefits, medicines, user } = useAppStore();
	const { user: authUser } = useAuth();
	const navigate = useNavigate();
	const [ready, setReady] = useState(false);
	const [downloading, setDownloading] = useState(false);
	const autopilotSourcePhone = user?.phone ?? authUser?.phone ?? '';
	const [qrPhone, setQrPhone] = useState(() => {
		const normalized = normalizePhoneToE164(autopilotSourcePhone);
		return normalized || autopilotSourcePhone || '';
	});
	const [qrResult, setQrResult] = useState<PrintQrResult | null>(null);
	const [qrLoading, setQrLoading] = useState(false);
	const [qrError, setQrError] = useState<string | null>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const autoRequestedRef = useRef<string | null>(null);
	const normalizedAutoPhone = useMemo(() => {
		if (!autopilotSourcePhone) return null;
		const normalized = normalizePhoneToE164(autopilotSourcePhone);
		return isValidPhone(normalized) ? normalized : null;
	}, [autopilotSourcePhone]);
	const printDate = useMemo(() => {
		return new Date().toLocaleString('ru-RU', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}, []);
	const normalizedUserCategory = user ? normalizeTargetGroup(user.category) : null;
	const userBenefits = useMemo(() => {
		if (!user) return benefits;
		return benefits.filter((benefit) => {
			const matchesRegion =
				benefit.regions.includes(user.region) || benefit.regions.includes('all');
			const matchesCategory = !normalizedUserCategory || benefit.targetGroups.includes(normalizedUserCategory);
			return matchesRegion && matchesCategory;
		});
	}, [benefits, normalizedUserCategory, user]);
	const soonExpiring = useMemo(() => {
		return userBenefits
			.filter((benefit) => typeof benefit.expiresIn === 'number')
			.reduce<Benefit | null>((closest, benefit) => {
				if (!closest) return benefit;
				const current = benefit.expiresIn ?? Number.MAX_SAFE_INTEGER;
				const best = closest.expiresIn ?? Number.MAX_SAFE_INTEGER;
				return current < best ? benefit : closest;
			}, null);
	}, [userBenefits]);
	const totalBenefitSavings = useMemo(() => {
		return userBenefits.reduce((sum, benefit) => sum + (benefit.savingsPerMonth ?? 0), 0);
	}, [userBenefits]);
	const totalMedicineCost = useMemo(() => {
		return medicines.reduce((sum, medicine) => {
			const cost =
				typeof medicine.discountedPrice === 'number'
					? medicine.discountedPrice
					: medicine.monthlyPrice;
			return sum + (cost ?? 0);
		}, 0);
	}, [medicines]);

	useEffect(() => {
		setReady(true);
	}, []);

	const handlePrint = () => window.print();

	const parsedQrPayload = useMemo<ParsedQrPayload | null>(() => {
		if (!qrResult?.qr?.payload) return null;
		try {
			const data = JSON.parse(qrResult.qr.payload);
			return typeof data === 'object' && data !== null ? (data as ParsedQrPayload) : null;
		} catch {
			return null;
		}
	}, [qrResult]);

	const qrPayloadText = useMemo(() => {
		if (!qrResult?.qr?.payload) return '';
		return parsedQrPayload
			? JSON.stringify(parsedQrPayload, null, 2)
			: qrResult.qr.payload;
	}, [parsedQrPayload, qrResult]);

	const qrGeneratedAtLabel = formatDetailedDate(
		parsedQrPayload?.generatedAt ?? qrResult?.requestedAt ?? null
	);
	const qrExpiresLabel = formatDetailedDate(qrResult?.expiresAt ?? null);
	const qrProviderLabel = parsedQrPayload?.provider ?? (qrResult?.mock ? 'mock' : '—');
	const qrBrandLabel = parsedQrPayload?.brand ?? '—';

	const buildReportPayload = useCallback(() => {
		const currentYear = new Date().getFullYear();
		const profileAge =
			typeof user?.birthYear === 'number' &&
			user.birthYear >= 1900 &&
			user.birthYear <= currentYear
				? currentYear - user.birthYear
				: null;

		const benefitsReport = userBenefits.map((benefit) => ({
			id: benefit.id,
			title: benefit.title,
			description: benefit.description,
			type: benefit.type,
			targetGroups: benefit.targetGroups,
			regions: benefit.regions,
			validFrom: benefit.validFrom,
			validTo: benefit.validTo,
			requirements: benefit.requirements,
			documents: benefit.documents,
			steps: benefit.steps,
			partner: benefit.partner,
			savingsPerMonth: benefit.savingsPerMonth,
			expiresIn: benefit.expiresIn ?? null,
		}));

		const medicinesReport = medicines.map((medicine) => ({
			id: medicine.id,
			name: medicine.name,
			dosage: medicine.dosage,
			frequency: medicine.frequency,
			prescribedBy: medicine.prescribedBy,
			prescribedDate: medicine.prescribedDate,
			refillDate: medicine.refillDate,
			monthlyPrice: medicine.monthlyPrice,
			discountedPrice: medicine.discountedPrice,
		}));

		return {
			generatedAt: new Date().toISOString(),
			printDateLabel: printDate,
			profile: {
				id: user?.id ?? null,
				name: user?.name ?? 'Пользователь',
				region: user?.region ?? '—',
				category: user?.category ?? '—',
				birthYear: user?.birthYear ?? null,
				age: profileAge,
			},
			stats: {
				benefitsCount: userBenefits.length,
				totalBenefitSavings,
				medicinesCount: medicines.length,
				totalMedicineCost,
			},
			soonExpiring: soonExpiring
				? {
					id: soonExpiring.id,
					title: soonExpiring.title,
					expiresIn: soonExpiring.expiresIn ?? null,
					validTo: soonExpiring.validTo ?? null,
				}
				: null,
			benefits: benefitsReport,
			medicines: medicinesReport,
		};
	}, [
		user,
		userBenefits,
		medicines,
		totalBenefitSavings,
		totalMedicineCost,
		soonExpiring,
		printDate,
	]);

	const generateQr = useCallback(async (normalized: string) => {
		setQrError(null);
		setQrLoading(true);
		try {
			const reportPayload = buildReportPayload();
			const data = await requestOtpCode(normalized, { report: reportPayload });
			if (!data.qr?.dataUrl) {
				throw new Error('Сервер не вернул QR-код. Повторите попытку.');
			}

			setQrResult({
				...data,
				normalizedPhone: normalized,
				requestedAt: new Date().toISOString(),
				expiresAt:
					typeof data.expiresIn === 'number'
						? new Date(Date.now() + data.expiresIn * 1000).toISOString()
						: null,
			});
			} catch (error) {
				console.error('QR request error:', error);
				const message =
					error instanceof Error ? error.message : 'Не удалось создать QR-код';
				setQrError(message);
			} finally {
				setQrLoading(false);
			}
		}, [buildReportPayload]);

	const handleGenerateQr = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const normalized = normalizePhoneToE164(qrPhone);
		if (!isValidPhone(normalized)) {
			setQrError('Введите номер телефона в формате +79991234567');
			return;
		}

		await generateQr(normalized);
	};

	useEffect(() => {
		if (!normalizedAutoPhone) return;
		if (qrLoading) return;
		if (autoRequestedRef.current === normalizedAutoPhone) return;

		autoRequestedRef.current = normalizedAutoPhone;
		setQrPhone((prev) => (prev ? prev : normalizedAutoPhone));
		void generateQr(normalizedAutoPhone);
	}, [normalizedAutoPhone, qrLoading, generateQr]);

const handleDownloadPdf = async () => {
	if (!contentRef.current) return;
	setDownloading(true);
	try {
		const [{ default: html2canvas }, { default: JsPDF }] = await Promise.all([
			import('html2canvas'),
			import('jspdf'),
		]);

		const canvas = await html2canvas(contentRef.current, {
			scale: 2,
			useCORS: true,
			scrollY: -window.scrollY,
		});
		const imgData = canvas.toDataURL('image/png');
		const pdf = new JsPDF('p', 'mm', 'a4');
			const pdfWidth = pdf.internal.pageSize.getWidth();
			const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
			const pageHeight = pdf.internal.pageSize.getHeight();
			let heightLeft = pdfHeight;
			let position = 0;

			pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
			heightLeft -= pageHeight;

			while (heightLeft > 0) {
				position = heightLeft - pdfHeight;
				pdf.addPage();
				pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
				heightLeft -= pageHeight;
			}

			pdf.save('support-plus-memo.pdf');
		} catch (error) {
			console.error('PDF generation error:', error);
		} finally {
			setDownloading(false);
		}
	};

	const summaryCards = [
		{
			label: 'Доступных льгот',
			value: userBenefits.length,
			description: 'Подходят под ваш профиль',
			icon: ClipboardList,
			accent: 'bg-primary/10 text-primary',
		},
		{
			label: 'Экономия в месяц',
			value: totalBenefitSavings ? formatCurrency(totalBenefitSavings) : '—',
			description: 'С учётом активных льгот',
			icon: FileText,
			accent: 'bg-emerald-50 text-emerald-600',
		},
		{
			label: 'Лекарств в аптечке',
			value: medicines.length,
			description: totalMedicineCost ? `Расходы ${formatCurrency(totalMedicineCost)}` : 'Расходы не указаны',
			icon: Pill,
			accent: 'bg-accent/10 text-accent',
		},
	];


	return (
		<div className="min-h-screen bg-background safe-area-top safe-area-bottom">
			<div className="no-print sticky top-0 z-50 bg-card border-b border-border shadow-sm">
				<div className="app-shell py-4 flex flex-wrap items-center justify-between gap-2">
					<Button variant="ghost" size="lg" onClick={() => navigate(-1)}>
						<ArrowLeft className="w-5 h-5 mr-2" />
						Назад
					</Button>
					<div className="flex flex-wrap gap-2">
						<Button
							variant="outline"
							size="lg"
							onClick={handleDownloadPdf}
							disabled={downloading}
						>
							<Download className="w-5 h-5 mr-2" />
							{downloading ? 'Формируем...' : 'Скачать PDF'}
						</Button>
						<Button variant="accent" size="lg" onClick={handlePrint}>
							<Printer className="w-5 h-5 mr-2" />
							Печать
						</Button>
					</div>
				</div>
			</div>

			{ready && (
				<div ref={contentRef} className="app-shell max-w-5xl py-8 space-y-8">
					<section className="print-friendly rounded-3xl border border-border/80 bg-white p-6 shadow-sm">
						<p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Персональная памятка</p>
						<h1 className="text-3xl font-bold text-slate-900 mt-2">Мои льготы и лекарства</h1>
						<div className="mt-4 grid gap-3 text-base text-muted-foreground md:grid-cols-2">
							<p><span className="font-semibold text-foreground">Пользователь:</span> {user?.name || 'Пользователь'}</p>
							<p><span className="font-semibold text-foreground">Регион:</span> {user?.region || '—'}</p>
							<p><span className="font-semibold text-foreground">Категория:</span> {user?.category || '—'}</p>
							<p><span className="font-semibold text-foreground">Дата формирования:</span> {printDate}</p>
						</div>
						{soonExpiring && (
							<div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
								<strong>Важно:</strong> льгота «{soonExpiring.title}» истекает через {soonExpiring.expiresIn} дней. Проверьте документы.
							</div>
						)}
					</section>

					<section className="print-friendly rounded-3xl border border-primary/30 bg-white p-6 shadow-sm">
						<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
							<div>
								<p className="text-xs uppercase tracking-[0.3em] text-primary/80">QR для печати</p>
								<h2 className="text-2xl font-bold text-slate-900 mt-1">Сформируйте пропуск</h2>
								<p className="text-muted-foreground">Запрос уходит в POST /otp/request, а на странице появляется QR для печати и requestId.</p>
							</div>
							<div className="no-print flex items-center gap-2 text-sm text-muted-foreground">
								<QrCode className="w-5 h-5 text-primary" />
								<span>Сканируется камерами и валидаторами</span>
							</div>
						</div>
						<form onSubmit={handleGenerateQr} className="no-print mt-6 grid gap-4 md:grid-cols-[minmax(0,360px)_auto]">
							<label className="space-y-2">
								<span className="text-sm font-medium text-muted-foreground">Номер телефона (формат E.164)</span>
								<input
									className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
									type="tel"
									placeholder="+79991234567"
									value={qrPhone}
									onChange={(event) => setQrPhone(event.target.value)}
								/>
							</label>
							<div className="flex items-end gap-2">
								<Button type="submit" size="lg" disabled={qrLoading || !qrPhone}>
									{qrLoading ? 'Создаём...' : 'Получить QR'}
								</Button>
								<Button
									type="button"
									variant="outline"
									size="lg"
									onClick={handlePrint}
									disabled={!qrResult?.qr?.dataUrl}
								>
									<Printer className="w-5 h-5 mr-2" />
									Печать QR
								</Button>
							</div>
						</form>
						{qrError && (
							<div className="no-print mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
								{qrError}
							</div>
						)}

						{qrResult?.qr?.dataUrl && (
							<div className="mt-6 grid gap-6 lg:grid-cols-[260px,minmax(0,1fr)]">
								<div className="rounded-3xl border border-border/70 bg-white p-4 text-center">
									<img
										src={qrResult.qr.dataUrl}
										alt={`QR-код для ${qrResult.normalizedPhone}`}
										className="w-full rounded-2xl border border-border object-contain"
									/>
									<p className="mt-3 text-xs text-muted-foreground">Вставьте код в макет или распечатайте прямо отсюда.</p>
								</div>
								<div className="space-y-4">
									<div className="grid gap-3 sm:grid-cols-2">
										<div className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
											<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Телефон</p>
											<p className="text-lg font-semibold">{qrResult.normalizedPhone}</p>
										</div>
										<div className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
											<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Request ID</p>
											<p className="font-mono text-sm break-all">{qrResult.requestId}</p>
										</div>
										<div className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
											<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Сгенерирован</p>
											<p className="text-sm font-semibold">{qrGeneratedAtLabel}</p>
										</div>
										<div className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
											<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Действителен до</p>
											<p className="text-sm font-semibold">{qrExpiresLabel}</p>
										</div>
										<div className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
											<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Провайдер</p>
											<p className="text-sm font-semibold">{qrProviderLabel}</p>
										</div>
										<div className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
											<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Бренд</p>
											<p className="text-sm font-semibold">{qrBrandLabel}</p>
										</div>
									</div>

									{qrPayloadText && (
										<div>
											<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Payload</p>
											<pre className="mt-2 max-h-60 overflow-auto rounded-2xl border border-border/70 bg-slate-50 p-4 text-xs font-mono leading-5 text-slate-700">
												{qrPayloadText}
											</pre>
										</div>
									)}

									{qrResult.mock && (
										<div className="rounded-2xl border border-dashed border-amber-400 bg-amber-50/70 p-4 text-sm text-amber-900">
											<p className="font-semibold">Тестовый режим (mock)</p>
											<p>SMS не отправляются; QR подходит только для демонстрации. {qrResult.mockCode && (
												<span>Код: <span className="font-mono">{qrResult.mockCode}</span></span>
											)}</p>
										</div>
									)}
								</div>
							</div>
						)}
					</section>

					<section className="print-friendly grid gap-4 md:grid-cols-3">
						{summaryCards.map((card) => (
							<div key={card.label} className={`rounded-3xl border border-border/70 p-4 flex flex-col gap-2 ${card.accent}`}>
								<div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em]">
									<card.icon className="w-4 h-4" />
									{card.label}
								</div>
								<p className="text-3xl font-bold">{card.value}</p>
								<p className="text-sm text-slate-600">{card.description}</p>
							</div>
						))}
					</section>

					<section className="print-friendly space-y-4">
						<div className="flex items-center gap-3">
							<div className="rounded-2xl bg-primary/10 p-2 text-primary">
								<ClipboardList className="w-5 h-5" />
							</div>
							<div>
								<h2 className="text-2xl font-bold">Список льгот ({userBenefits.length})</h2>
								<p className="text-muted-foreground">Описание, документы и шаги для каждой выплаты.</p>
							</div>
						</div>

						{userBenefits.length === 0 ? (
							<div className="rounded-3xl border border-dashed border-border/70 p-8 text-center text-muted-foreground">
								Льготы не найдены. Проверьте данные профиля или обратитесь в горячую линию.
							</div>
						) : (
							userBenefits.map((benefit, idx) => (
								<article key={benefit.id} className="print-friendly rounded-3xl border border-border/80 bg-white p-5 shadow-sm space-y-4">
									<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
										<div>
											<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Льгота {idx + 1}</p>
											<h3 className="text-2xl font-bold text-slate-900">{benefit.title}</h3>
											<p className="text-base text-muted-foreground">{benefit.description}</p>
										</div>
										{benefit.savingsPerMonth && (
											<div className="rounded-2xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
												Экономия {formatCurrency(benefit.savingsPerMonth)}/мес
											</div>
										)}
									</div>

									<div className="grid gap-3 md:grid-cols-3 text-sm">
										<div className="rounded-2xl border border-border/60 p-3">
											<p className="text-muted-foreground">Срок действия</p>
											<p className="font-semibold">{formatDate(benefit.validFrom)} — {formatDate(benefit.validTo)}</p>
										</div>
										<div className="rounded-2xl border border-border/60 p-3">
											<p className="text-muted-foreground">Партнёр / ведомство</p>
											<p className="font-semibold">{benefit.partner || '—'}</p>
										</div>
										<div className="rounded-2xl border border-border/60 p-3">
											<p className="text-muted-foreground">Тип</p>
											<p className="font-semibold">{benefit.type}</p>
										</div>
									</div>

									<div className="grid gap-4 md:grid-cols-2">
										<div>
											<p className="font-semibold text-slate-900 flex items-center gap-2">
												<ShieldCheck className="w-4 h-4" /> Требования
											</p>
											<ul className="mt-2 space-y-1 text-sm">
												{benefit.requirements.map((req, i) => (
													<li key={i} className="flex items-start gap-2">
														<CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
														<span>{req}</span>
													</li>
												))}
											</ul>
										</div>
										<div>
											<p className="font-semibold text-slate-900 flex items-center gap-2">
												<FileText className="w-4 h-4" /> Документы
											</p>
											<ul className="mt-2 space-y-1 text-sm">
												{benefit.documents.map((doc, i) => (
													<li key={i}>{doc}</li>
												))}
										</ul>
									</div>
								</div>

								<div>
									<p className="font-semibold text-slate-900">Шаги получения</p>
									<ol className="mt-2 space-y-2 text-sm">
										{benefit.steps.map((step, i) => (
											<li key={i} className="flex gap-3">
												<span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
													{i + 1}
												</span>
												<p className="flex-1">{step}</p>
											</li>
										))}
									</ol>
								</div>
							</article>
							))
						)}
					</section>

					{medicines.length > 0 && (
						<section className="print-friendly space-y-4">
							<div className="flex items-center gap-3">
								<div className="rounded-2xl bg-primary/10 p-2 text-primary">
									<Pill className="w-5 h-5" />
								</div>
								<div>
									<h2 className="text-2xl font-bold">Моя аптечка ({medicines.length})</h2>
									<p className="text-muted-foreground">Дозировки, расходы и напоминания по рецептам.</p>
								</div>
							</div>

							{medicines.map((medicine, idx) => (
								<article key={medicine.id} className="print-friendly rounded-3xl border border-border/80 bg-white p-5 shadow-sm space-y-3">
									<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
										<div>
											<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Препарат {idx + 1}</p>
											<h3 className="text-xl font-semibold text-slate-900">{medicine.name}</h3>
											<p className="text-sm text-muted-foreground">{medicine.dosage} • {medicine.frequency}</p>
										</div>
										<div className="text-right text-sm">
											<p className="font-semibold">{formatCurrency(medicine.monthlyPrice)}</p>
											{medicine.discountedPrice !== undefined && (
												<p className="text-primary">
													Со скидкой: {medicine.discountedPrice === 0 ? 'бесплатно' : formatCurrency(medicine.discountedPrice)}
												</p>
											)}
										</div>
									</div>

									<div className="grid gap-3 md:grid-cols-2 text-sm text-muted-foreground">
										{medicine.prescribedBy && <p><span className="font-semibold text-foreground">Назначил:</span> {medicine.prescribedBy}</p>}
										{medicine.prescribedDate && <p><span className="font-semibold text-foreground">Назначение:</span> {formatDate(medicine.prescribedDate)}</p>}
										{medicine.refillDate && <p><span className="font-semibold text-foreground">Обновить рецепт:</span> {formatDate(medicine.refillDate)}</p>}
									</div>
								</article>
							))}
						</section>
					)}

					<footer className="print-friendly mt-12 rounded-3xl border border-border bg-white p-6 text-center text-sm text-muted-foreground">
						<p className="text-base font-semibold text-foreground">Рука помощи • Социальный навигатор</p>
						<p className="mt-2">© 2024 • Регион {user?.region || '—'} • Горячая линия 122</p>
					</footer>
				</div>
			)}
		</div>
	);
};
