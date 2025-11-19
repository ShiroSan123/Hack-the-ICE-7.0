import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { Link } from 'react-router-dom';
import {
	type CarouselApi,
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from '@/components/ui/carousel';

export type PriorityCardData = {
	id: string;
	badge: string;
	title: string;
	description: string;
	accent: string;
	icon: ReactNode;
	action?: {
		label: string;
		to: string;
	};
};

type Props = {
	cards: PriorityCardData[];
};

export const PriorityStack = ({ cards }: Props) => {
	if (cards.length === 0) return null;

	const [active, setActive] = useState(0);
	const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);

	const sliderCards = useMemo(
		() => cards.map((card) => ({ ...card })),
		[cards]
	);

	useEffect(() => {
		if (!carouselApi) return;

		const updateActive = () => setActive(carouselApi.selectedScrollSnap());
		updateActive();
		carouselApi.on('select', updateActive);
		carouselApi.on('reInit', updateActive);

		return () => {
			carouselApi.off('select', updateActive);
			carouselApi.off('reInit', updateActive);
		};
	}, [carouselApi]);

	return (
		<section aria-label="Персональные подсказки" className="relative">
			<div className="flex items-center justify-between mb-3">
				<div>
					<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">важно сегодня</p>
					<h2 className="text-2xl font-semibold">Ваши подсказки</h2>
				</div>
				<div className="text-sm text-muted-foreground">
					{active + 1}/{sliderCards.length}
				</div>
			</div>

			<Carousel
				className="w-full"
				opts={{ align: 'start', loop: sliderCards.length > 1 }}
				setApi={setCarouselApi}
			>
				<CarouselContent>
					{sliderCards.map((card) => (
						<CarouselItem key={card.id} className="md:basis-2/3 lg:basis-1/2">
							<article className={`relative min-h-[220px] rounded-[32px] border border-white/30 p-6 md:p-8 text-white bg-gradient-to-br ${card.accent}`}>
								<div className="pointer-events-none absolute inset-0 rounded-[32px] border border-white/25 mix-blend-screen" />
								<div className="relative flex flex-col gap-5">
									<div className="flex items-start justify-between gap-4">
										<div className="space-y-3">
											<p className="text-[0.65rem] uppercase tracking-[0.4em] text-white/70">
												{card.badge}
											</p>
											<h3 className="text-2xl font-semibold leading-tight drop-shadow-lg">
												{card.title}
											</h3>
											<p className="text-base text-white/90 leading-relaxed">{card.description}</p>
										</div>
										<div
											className="hidden sm:flex items-center justify-center rounded-2xl bg-black/20 p-4 min-w-[72px] text-white"
											aria-hidden="true"
										>
											{card.icon}
										</div>
									</div>

									<div className="flex items-center justify-between gap-4">
										{card.action && (
											<Button
												variant="secondary"
												size="sm"
												asChild
												className="bg-black/30 text-white font-medium backdrop-blur hover:bg-black/40"
											>
												<Link to={card.action.to}>{card.action.label}</Link>
											</Button>
										)}
										<div className="ml-auto hidden md:block text-xs uppercase tracking-[0.3em] text-white/70">
											card
										</div>
									</div>
								</div>
							</article>
						</CarouselItem>
					))}
				</CarouselContent>

				{sliderCards.length > 1 && (
					<>
						<CarouselPrevious className="left-2 top-1/2 -translate-y-1/2 border-none bg-card/70 text-primary shadow-lg hover:bg-card" />
						<CarouselNext className="right-2 top-1/2 -translate-y-1/2 border-none bg-card/70 text-primary shadow-lg hover:bg-card" />
					</>
				)}
			</Carousel>
		</section>
	);
};
