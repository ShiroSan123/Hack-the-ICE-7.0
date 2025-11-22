import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, Benefit, Offer, Medicine } from '../types'

interface AppState {
	user: UserProfile | null;
	benefits: Benefit[];
	offers: Offer[];
	medicines: Medicine[];
	hiddenBenefitIds: string[];
	setUser: (user: UserProfile | null) => void;
	setBenefits: (benefits: Benefit[]) => void;
	setOffers: (offers: Offer[]) => void;
	setMedicines: (medicines: Medicine[]) => void;
	toggleHiddenBenefit: (id: string) => void;
	logout: () => void;
}

export const useAppStore = create<AppState>()(
	persist(
		(set) => ({
			user: null,
			benefits: [],
			offers: [],
			medicines: [],
			hiddenBenefitIds: [],

			setUser: (user) => set({ user }),

			setBenefits: (benefits) => set({ benefits }),

			setOffers: (offers) => set({ offers }),

			setMedicines: (medicines) => set({ medicines }),

			toggleHiddenBenefit: (id) =>
				set((state) => ({
					hiddenBenefitIds: state.hiddenBenefitIds.includes(id)
						? state.hiddenBenefitIds.filter((benefitId) => benefitId !== id)
						: [...state.hiddenBenefitIds, id],
				})),

			logout: () => set({ user: null, hiddenBenefitIds: [] }),
		}),
		{
			name: 'support-plus-storage',
		}
	)
);
