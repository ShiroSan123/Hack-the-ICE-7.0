import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Medicine } from '@/shared/types';
import { formatCurrency, formatDate } from '@/shared/lib/formatters';
import { useAppStore } from '@/shared/store/useAppStore';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Tag } from 'lucide-react';

interface MedicineCardProps {
	medicine: Medicine;
}

export const MedicineCard = ({ medicine }: MedicineCardProps) => {
	const { benefits, offers } = useAppStore();

	const relatedBenefits = benefits.filter(b =>
		medicine.relatedBenefitIds.includes(b.id)
	);

	const relatedOffers = offers.filter(o =>
		medicine.relatedOfferIds.includes(o.id)
	);

	const priceDiff = Math.max(
		medicine.monthlyPrice - (medicine.discountedPrice ?? medicine.monthlyPrice),
		0
	);
	const isFree = medicine.discountedPrice === 0;

	return (
		<Card className="rounded-3xl border border-border/70 shadow-sm">
			<CardHeader>
				<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
					<div>
						<CardTitle className="text-2xl">{medicine.name}</CardTitle>
						<p className="text-base text-muted-foreground">
							{medicine.dosage} • {medicine.frequency}
						</p>
					</div>
					<div className="text-right">
						{medicine.discountedPrice !== undefined && medicine.discountedPrice < medicine.monthlyPrice ? (
							<>
								<p className="text-sm text-muted-foreground line-through">
									{formatCurrency(medicine.monthlyPrice)}
								</p>
								<p className="text-2xl font-bold text-primary">
									{isFree ? 'Бесплатно' : formatCurrency(medicine.discountedPrice || 0)}
								</p>
								<p className="text-xs uppercase text-primary/70">в месяц</p>
							</>
						) : (
							<>
								<p className="text-2xl font-bold">{formatCurrency(medicine.monthlyPrice)}</p>
								<p className="text-xs uppercase text-muted-foreground">в месяц</p>
							</>
						)}
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				{priceDiff > 0 && (
					<div className="rounded-2xl bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
						Экономия {formatCurrency(priceDiff)} в месяц
					</div>
				)}

				{medicine.prescribedBy && (
					<div className="flex items-center gap-2 text-muted-foreground">
						<User className="w-5 h-5 flex-shrink-0" />
						<span>{medicine.prescribedBy}</span>
					</div>
				)}

				<div className="grid gap-2 sm:grid-cols-2">
					{medicine.prescribedDate && (
						<div className="flex items-center gap-2 text-muted-foreground">
							<Calendar className="w-5 h-5 flex-shrink-0" />
							<span>Назначено: {formatDate(medicine.prescribedDate)}</span>
						</div>
					)}
					{medicine.refillDate && (
						<div className="flex items-center gap-2 text-muted-foreground">
							<Calendar className="w-5 h-5 flex-shrink-0" />
							<span>Обновить рецепт: {formatDate(medicine.refillDate)}</span>
						</div>
					)}
				</div>

				{relatedBenefits.length > 0 && (
					<div>
						<p className="text-sm font-medium mb-2 flex items-center gap-2">
							<Tag className="w-4 h-4" />
							Льготы:
						</p>
						<div className="flex flex-wrap gap-2">
							{relatedBenefits.map((benefit) => (
								<Badge key={benefit.id} variant="default" className="rounded-full">
									{benefit.title}
								</Badge>
							))}
						</div>
					</div>
				)}

				{relatedOffers.length > 0 && (
					<div>
						<p className="text-sm font-medium mb-2 flex items-center gap-2">
							<Tag className="w-4 h-4" />
							Скидки:
						</p>
						<div className="flex flex-wrap gap-2">
							{relatedOffers.map((offer) => (
								<Badge key={offer.id} variant="secondary" className="rounded-full">
									{offer.title} ({offer.discount}%)
								</Badge>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
