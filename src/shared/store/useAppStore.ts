import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, Benefit, Offer, Medicine } from '../types';

type UserScopedState = {
	benefits: Benefit[];
	offers: Offer[];
	medicines: Medicine[];
	hiddenBenefitIds: string[];
};

type UserStateMap = Record<string, UserScopedState>;

const createEmptyUserScopedState = (): UserScopedState => ({
	benefits: [],
	offers: [],
	medicines: [],
	hiddenBenefitIds: [],
});

const ensureUserScopedState = (
	userData: UserStateMap,
	userId: string
): { scoped: UserScopedState; map: UserStateMap } => {
	const existing = userData[userId];
	if (existing) {
		return { scoped: existing, map: userData };
	}

	const scoped = createEmptyUserScopedState();
	return {
		scoped,
		map: { ...userData, [userId]: scoped },
	};
};

const updateUserScopedState = (
	userData: UserStateMap,
	userId: string,
	patch: Partial<UserScopedState>
) => {
	const base = userData[userId] ?? createEmptyUserScopedState();
	return {
		...userData,
		[userId]: {
			...base,
			...patch,
		},
	};
};

interface AppState {
	user: UserProfile | null;
	activeUserId: string | null;
	benefits: Benefit[];
	offers: Offer[];
	medicines: Medicine[];
	hiddenBenefitIds: string[];
	userData: UserStateMap;
	setUser: (user: UserProfile | null) => void;
	setBenefits: (benefits: Benefit[]) => void;
	setOffers: (offers: Offer[]) => void;
	setMedicines: (medicines: Medicine[]) => void;
	toggleHiddenBenefit: (id: string) => void;
	setSimpleMode: (enabled: boolean) => void;
	logout: () => void;
}

export const useAppStore = create<AppState>()(
	persist(
		(set) => ({
			user: null,
			activeUserId: null,
			benefits: [],
			offers: [],
			medicines: [],
			hiddenBenefitIds: [],
			userData: {},

			setUser: (user) =>
				set((state) => {
					const nextUserId = user?.authUserId ?? null;

					if (!nextUserId) {
						return {
							...state,
							user: null,
							activeUserId: null,
							benefits: [],
							offers: [],
							medicines: [],
							hiddenBenefitIds: [],
						};
					}

					const { scoped, map } = ensureUserScopedState(
						state.userData,
						nextUserId
					);

					return {
						...state,
						user,
						activeUserId: nextUserId,
						userData: map,
						benefits: scoped.benefits,
						offers: scoped.offers,
						medicines: scoped.medicines,
						hiddenBenefitIds: scoped.hiddenBenefitIds,
					};
				}),

			setBenefits: (benefits) =>
				set((state) => {
					if (!state.activeUserId) {
						return { ...state, benefits };
					}

					return {
						...state,
						benefits,
						userData: updateUserScopedState(state.userData, state.activeUserId, {
							benefits,
						}),
					};
				}),

			setOffers: (offers) =>
				set((state) => {
					if (!state.activeUserId) {
						return { ...state, offers };
					}

					return {
						...state,
						offers,
						userData: updateUserScopedState(state.userData, state.activeUserId, {
							offers,
						}),
					};
				}),

			setMedicines: (medicines) =>
				set((state) => {
					if (!state.activeUserId) {
						return { ...state, medicines };
					}

					return {
						...state,
						medicines,
						userData: updateUserScopedState(state.userData, state.activeUserId, {
							medicines,
						}),
					};
				}),

			toggleHiddenBenefit: (id) =>
				set((state) => {
					const list = state.hiddenBenefitIds.includes(id)
						? state.hiddenBenefitIds.filter((benefitId) => benefitId !== id)
						: [...state.hiddenBenefitIds, id];

					if (!state.activeUserId) {
						return { ...state, hiddenBenefitIds: list };
					}

					return {
						...state,
						hiddenBenefitIds: list,
						userData: updateUserScopedState(state.userData, state.activeUserId, {
							hiddenBenefitIds: list,
						}),
					};
				}),

			setSimpleMode: (enabled) =>
				set((state) => {
					if (!state.user) return state;
					return {
						...state,
						user: {
							...state.user,
							simpleModeEnabled: enabled,
						},
					};
				}),

			logout: () =>
				set((state) => ({
					...state,
					user: null,
					activeUserId: null,
					benefits: [],
					offers: [],
					medicines: [],
					hiddenBenefitIds: [],
				})),
		}),
		{
			name: 'support-plus-storage',
		}
	)
);
