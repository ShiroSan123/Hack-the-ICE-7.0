import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/shared/ui/Button';
import { useAppStore } from '@/shared/store/useAppStore';
import {
	Printer,
	ArrowLeft,
	Download,
	ClipboardList,
	FileText,
	Pill,
	ShieldCheck,
	CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatCurrency } from '@/shared/lib/formatters';

export const PrintView = () => {
	const { benefits, medicines, user } = useAppStore();
	const navigate = useNavigate();
	const [ready, setReady] = useState(false);
	const [downloading, setDownloading] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setReady(true);
	}, []);

	const handlePrint = () => window.print();

	const handleDownloadPdf = async () => {
		if (!contentRef.current) return;
		setDownloading(true);
		try {
			const canvas = await html2canvas(contentRef.current, {
				scale: 2,
				useCORS: true,
				scrollY: -window.scrollY,
			});
			const imgData = canvas.toDataURL('image/png');
			const pdf = new jsPDF('p', 'mm', 'a4');
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

	const userBenefits = user
		? benefits.filter(
			(b) =>
				b.targetGroups.includes(user.category) &&
				(b.regions.includes(user.region) || b.regions.includes('all'))
			)
		: benefits;

	const totalBenefitSavings = userBenefits.reduce(
		(sum, benefit) => sum + (benefit.savingsPerMonth ?? 0),
		0
	);

	const totalMedicineCost = medicines.reduce(
		(sum, med) => sum + (med.discountedPrice ?? med.monthlyPrice),
		0
	);

	const soonExpiring = userBenefits
		.filter((benefit) => typeof benefit.expiresIn === 'number')
		.sort((a, b) => (a.expiresIn ?? Infinity) - (b.expiresIn ?? Infinity))[0];

	const printDate = formatDate(new Date().toISOString());

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
		<div className="min-h-screen bg-background">
			<div className="no-print sticky top-0 z-50 bg-card border-b border-border shadow-sm">
				<div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-2">
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
				<div ref={contentRef} className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
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
						<p className="text-base font-semibold text-foreground">Поддержка++ • Социальный навигатор</p>
						<p className="mt-2">© 2024 • Регион {user?.region || '—'} • Горячая линия 122</p>
					</footer>
				</div>
			)}
		</div>
	);
};
