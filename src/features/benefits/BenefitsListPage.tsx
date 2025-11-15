import { useState, useEffect } from 'react';
import { Layout } from '@/shared/ui/Layout';
import { useAppStore } from '@/shared/store/useAppStore';
import { benefitsApi } from '@/shared/api/benefitsApi';
import { BenefitCard } from './components/BenefitCard';
import { BenefitsFilters } from './components/BenefitsFilters';
import { Benefit } from '@/shared/types';
import { Loader2 } from 'lucide-react';

export const BenefitsListPage = () => {
	const { benefits, setBenefits, hiddenBenefitIds, user } = useAppStore();
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedType, setSelectedType] = useState('all');

	useEffect(() => {
		const loadBenefits = async () => {
			try {
				const data = await benefitsApi.getAll();
				setBenefits(data);
			} catch (error) {
				console.error('Failed to load benefits:', error);
			} finally {
				setLoading(false);
			}
		};

		loadBenefits();
	}, [setBenefits]);

	const filteredBenefits = benefits.filter((benefit: Benefit) => {
		// Filter hidden
		if (hiddenBenefitIds.includes(benefit.id)) return false;

		// Filter by user region
		if (user && !benefit.regions.includes(user.region) && !benefit.regions.includes('all')) {
			return false;
		}

		// Filter by user category
		if (user && !benefit.targetGroups.includes(user.category)) {
			return false;
		}

		// Filter by search query
		if (searchQuery && !benefit.title.toLowerCase().includes(searchQuery.toLowerCase())) {
			return false;
		}

		// Filter by type
		if (selectedType !== 'all' && benefit.type !== selectedType) {
			return false;
		}

		return true;
	});

	if (loading) {
		return (
			<Layout title="Льготы">
				<div className="flex items-center justify-center min-h-[400px]">
					<Loader2 className="w-12 h-12 animate-spin text-primary" />
				</div>
			</Layout>
		);
	}

	return (
		<Layout title="Все льготы">
			<div className="grid md:grid-cols-4 gap-6">
				<div className="md:col-span-1">
					<BenefitsFilters
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						selectedType={selectedType}
						onTypeChange={setSelectedType}
					/>
				</div>

				<div className="md:col-span-3 space-y-4">
					{filteredBenefits.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-xl text-muted-foreground">
								Льготы не найдены
							</p>
						</div>
					) : (
						filteredBenefits.map((benefit: Benefit) => (
							<BenefitCard key={benefit.id} benefit={benefit} />
						))
					)}
				</div>
			</div>
		</Layout>
	);
};
