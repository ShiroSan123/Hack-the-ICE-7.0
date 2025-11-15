export interface Medicine {
	id: string;
	name: string;
	dosage: string;
	frequency: string;
	prescribedBy?: string;
	prescribedDate?: string;
	refillDate?: string;
	relatedBenefitIds: string[];
	relatedOfferIds: string[];
	monthlyPrice: number;
	discountedPrice?: number;
}
