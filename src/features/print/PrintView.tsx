import { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { useAppStore } from '@/shared/store/useAppStore';
import { Printer, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatCurrency } from '@/shared/lib/formatters';

export const PrintView = () => {
	const { benefits, medicines, user } = useAppStore();
	const navigate = useNavigate();
	const [ready, setReady] = useState(false);

	useEffect(() => {
		setReady(true);
	}, []);

	const handlePrint = () => {
		window.print();
	};

	const userBenefits = user
		? benefits.filter(b =>
			b.targetGroups.includes(user.category) &&
			b.regions.includes(user.region)
		)
		: benefits;

	return (
		<div className="min-h-screen bg-background">
			<div className="no-print sticky top-0 z-50 bg-card border-b-2 border-border shadow-md">
				<div className="container mx-auto px-4 py-4 flex items-center justify-between">
					<Button variant="ghost" size="lg" onClick={() => navigate(-1)}>
						<ArrowLeft className="w-5 h-5 mr-2" />
						Назад
					</Button>
					<Button variant="accent" size="lg" onClick={handlePrint}>
						<Printer className="w-5 h-5 mr-2" />
						Печать
					</Button>
				</div>
			</div>

			{ready && (
				<div className="container mx-auto px-4 py-8 max-w-4xl">
					<div className="print-friendly mb-8">
						<h1 className="text-4xl font-bold mb-2">Мои льготы и лекарства</h1>
						{user && (
							<div className="text-lg text-muted-foreground">
								<p>Пользователь: {user.name || 'Пользователь'}</p>
								<p>Регион: {user.region}</p>
								<p>Категория: {user.category}</p>
								<p>Дата печати: {formatDate(new Date().toISOString())}</p>
							</div>
						)}
					</div>

					<div className="space-y-8">
						<section className="print-friendly">
							<h2 className="text-3xl font-bold mb-4 pb-2 border-b-2 border-border">
								Доступные льготы ({userBenefits.length})
							</h2>
							<div className="space-y-6">
								{userBenefits.map((benefit, idx) => (
									<div key={benefit.id} className="border-2 border-border rounded-lg p-4 print-friendly">
										<h3 className="text-2xl font-bold mb-2">
											{idx + 1}. {benefit.title}
										</h3>
										<p className="text-lg mb-3">{benefit.description}</p>

										<div className="grid md:grid-cols-2 gap-4 mb-3">
											<div>
												<p className="font-semibold">Срок действия:</p>
												<p>{formatDate(benefit.validFrom)} — {formatDate(benefit.validTo)}</p>
											</div>
											{benefit.savingsPerMonth && (
												<div>
													<p className="font-semibold">Экономия в месяц:</p>
													<p>{formatCurrency(benefit.savingsPerMonth)}</p>
												</div>
											)}
										</div>

										<div className="mb-3">
											<p className="font-semibold mb-1">Требования:</p>
											<ul className="list-disc list-inside space-y-1">
												{benefit.requirements.map((req, i) => (
													<li key={i}>{req}</li>
												))}
											</ul>
										</div>

										<div className="mb-3">
											<p className="font-semibold mb-1">Необходимые документы:</p>
											<ul className="list-disc list-inside space-y-1">
												{benefit.documents.map((doc, i) => (
													<li key={i}>{doc}</li>
												))}
											</ul>
										</div>

										<div>
											<p className="font-semibold mb-1">Шаги получения:</p>
											<ol className="list-decimal list-inside space-y-1">
												{benefit.steps.map((step, i) => (
													<li key={i}>{step}</li>
												))}
											</ol>
										</div>

										{benefit.partner && (
											<p className="mt-3 text-muted-foreground">
												Партнёр: {benefit.partner}
											</p>
										)}
									</div>
								))}
							</div>
						</section>

						{medicines.length > 0 && (
							<section className="print-friendly">
								<h2 className="text-3xl font-bold mb-4 pb-2 border-b-2 border-border">
									Моя аптечка ({medicines.length})
								</h2>
								<div className="space-y-4">
									{medicines.map((medicine, idx) => (
										<div key={medicine.id} className="border-2 border-border rounded-lg p-4 print-friendly">
											<h3 className="text-2xl font-bold mb-2">
												{idx + 1}. {medicine.name}
											</h3>
											<div className="grid md:grid-cols-2 gap-3">
												<div>
													<p><strong>Дозировка:</strong> {medicine.dosage}</p>
													<p><strong>Частота:</strong> {medicine.frequency}</p>
												</div>
												<div>
													<p><strong>Стоимость в месяц:</strong> {formatCurrency(medicine.monthlyPrice)}</p>
													{medicine.discountedPrice !== undefined && (
														<p><strong>Со скидкой:</strong> {medicine.discountedPrice === 0 ? 'Бесплатно' : formatCurrency(medicine.discountedPrice)}</p>
													)}
												</div>
											</div>
											{medicine.prescribedBy && (
												<p className="mt-2"><strong>Назначил:</strong> {medicine.prescribedBy}</p>
											)}
											{medicine.refillDate && (
												<p><strong>Обновить рецепт:</strong> {formatDate(medicine.refillDate)}</p>
											)}
										</div>
									))}
								</div>
							</section>
						)}
					</div>

					<footer className="mt-12 pt-6 border-t-2 border-border text-center text-muted-foreground print-friendly">
						<p className="text-lg">Поддержка++ • Социальный навигатор</p>
						<p>© 2024 • Регион {user?.region || 'xxxxxxxxx'}</p>
					</footer>
				</div>
			)}
		</div>
	);
};
