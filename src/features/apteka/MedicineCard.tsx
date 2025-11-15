import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Medicine } from '@/shared/types';
import { formatCurrency } from '@/shared/lib/formatters';
import { formatDate } from '@/shared/lib/formatters';
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

	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<CardTitle className="text-2xl">{medicine.name}</CardTitle>
						<p className="text-lg text-muted-foreground mt-1">
							{medicine.dosage} • {medicine.frequency}
						</p>
					</div>
					<div className="text-right">
						{medicine.discountedPrice !== undefined && medicine.discountedPrice < medicine.monthlyPrice ? (
							<>
								<p className="text-lg line-through text-muted-foreground">
									{formatCurrency(medicine.monthlyPrice)}
								</p>
								<p className="text-2xl font-bold text-primary">
									{medicine.discountedPrice === 0 ? 'Бесплатно' : formatCurrency(medicine.discountedPrice)}
								</p>
							</>
						) : (
							<p className="text-2xl font-bold">
								{formatCurrency(medicine.monthlyPrice)}
							</p>
						)}
						<p className="text-sm text-muted-foreground">в месяц</p>
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				{medicine.prescribedBy && (
					<div className="flex items-center gap-2 text-muted-foreground">
						<User className="w-5 h-5 flex-shrink-0" />
						<span>{medicine.prescribedBy}</span>
					</div>
				)}

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

				{relatedBenefits.length > 0 && (
					<div>
						<p className="text-sm font-medium mb-2 flex items-center gap-2">
							<Tag className="w-4 h-4" />
							Доступные льготы:
						</p>
						<div className="flex flex-wrap gap-2">
							{relatedBenefits.map(benefit => (
								<Badge key={benefit.id} variant="default">
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
							Скидки и предложения:
						</p>
						<div className="flex flex-wrap gap-2">
							{relatedOffers.map(offer => (
								<Badge key={offer.id} variant="secondary">
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
