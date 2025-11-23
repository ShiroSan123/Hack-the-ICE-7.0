import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Layout } from '@/shared/ui/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { useAppStore } from '@/shared/store/useAppStore';
import { benefitsApi } from '@/shared/api/benefitsApi';
import { Benefit } from '@/shared/types';
import { formatCurrency } from '@/shared/lib/formatters';
import { normalizeTargetGroup } from '@/shared/lib/targetGroups';
import { cn } from '@/lib/utils';
import { MessageCircle, Send, Sparkles, Heart, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChatMessage {
	id: string;
	role: 'assistant' | 'user';
	text: string;
	timestamp: string;
	highlights?: Benefit[];
}

const quickPrompts = [
	'Какие льготы доступны пенсионеру?',
	'Нужна скидка на лекарства',
	'Какие документы нужны для оплаты ЖКХ',
	'Подскажи про бесплатный проезд',
];

export const ChatBotPage = () => {
	const { benefits, setBenefits, user } = useAppStore();
	const [input, setInput] = useState('');
	const [messages, setMessages] = useState<ChatMessage[]>(() => [
		{
			id: 'assistant-hello',
			role: 'assistant',
			text: 'Здравствуйте! Я ассистент Поддержка++. Расскажите, какую льготу или помощь вы ищете, и я подскажу шаги и документы.',
			timestamp: new Date().toISOString(),
		},
	]);
	const scrollRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (benefits.length === 0) {
			benefitsApi
				.getAll()
				.then(setBenefits)
				.catch((error) => console.error('Failed to load benefits for chat:', error));
		}
	}, [benefits.length, setBenefits]);

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [messages]);

	const normalizedUserCategory = user ? normalizeTargetGroup(user.category) : null;
	const accessibleBenefits = useMemo(() => {
		if (!user) return benefits;
		return benefits.filter((benefit) => {
			const matchesRegion = benefit.regions.includes(user.region) || benefit.regions.includes('all');
			const matchesCategory =
				!normalizedUserCategory || benefit.targetGroups.includes(normalizedUserCategory);
			return matchesRegion && matchesCategory;
		});
	}, [benefits, normalizedUserCategory, user]);

const buildAssistantReply = (question: string): ChatMessage => {
		const normalized = question.toLowerCase();
		const matched = accessibleBenefits
			.filter((benefit) =>
				benefit.title.toLowerCase().includes(normalized) ||
				benefit.description.toLowerCase().includes(normalized) ||
				benefit.type.toLowerCase().includes(normalized)
			)
			.slice(0, 3);

		const text = matched.length
			? `Я подобрала ${matched.length} подходящих льготы. Посмотрите описание и шаги, а если нужна помощь с документами — нажмите кнопку «Подробнее».`
			: 'Я записала ваш вопрос и сохраню его в истории. Пока не нашла точную льготу, но могу подсказать по документам или отправить в профиль.';

		return {
			id: `assistant-${Date.now()}`,
			role: 'assistant',
			text,
			timestamp: new Date().toISOString(),
			highlights: matched,
		};
	};

	const sendMessage = (text: string) => {
		const trimmed = text.trim();
		if (!trimmed) return;

		const userMessage: ChatMessage = {
			id: `user-${Date.now()}`,
			role: 'user',
			text: trimmed,
			timestamp: new Date().toISOString(),
		};

		const reply = buildAssistantReply(trimmed);
		setMessages((prev) => [...prev, userMessage, reply]);
		setInput('');
	};

	const handleSend = (event?: FormEvent) => {
		if (event) event.preventDefault();
		sendMessage(input);
	};

	return (
		<Layout title="Чат-бот Поддержка++">
			<div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
				<section className="rounded-3xl border border-border/80 bg-white p-4 md:p-6 flex flex-col">
					<div className="flex items-center gap-3 mb-4">
						<div className="rounded-2xl bg-primary/10 p-3 text-primary">
							<MessageCircle className="w-6 h-6" />
						</div>
						<div>
							<p className="text-xl font-semibold">Ассистент всегда рядом</p>
							<p className="text-sm text-muted-foreground">Ответы строятся на ваших данных и регионе.</p>
						</div>
					</div>

					<div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1">
						{messages.map((message) => (
							<div
								key={message.id}
								className={cn(
									'rounded-3xl border px-4 py-3 max-w-2xl',
									message.role === 'assistant'
										? 'bg-primary/5 border-primary/20 text-slate-900'
										: 'bg-white border-border/70 self-end ml-auto shadow-sm'
								)}
							>
								<p className="text-base leading-relaxed">{message.text}</p>
								<p className="mt-2 text-xs text-muted-foreground">{new Date(message.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>
								{message.highlights && message.highlights.length > 0 && (
									<div className="mt-4 space-y-3">
										{message.highlights.map((benefit) => (
											<Card key={benefit.id} className="rounded-2xl border border-border/70">
												<CardContent className="pt-4">
													<p className="text-base font-semibold">{benefit.title}</p>
													<p className="text-sm text-muted-foreground">{benefit.description}</p>
													<div className="mt-3 flex items-center justify-between text-sm">
														{benefit.savingsPerMonth && (
															<span className="text-primary font-semibold">{formatCurrency(benefit.savingsPerMonth)}/мес</span>
														)}
														<Button variant="link" size="sm" asChild className="px-0">
															<Link to={`/benefits/${benefit.id}`}>Подробнее</Link>
														</Button>
													</div>
												</CardContent>
											</Card>
										))}
									</div>
								)}
							</div>
						))}
					</div>

					<form onSubmit={handleSend} className="mt-4 space-y-3">
						<textarea
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder="Например: какие скидки на лекарства в моём регионе"
							className="w-full rounded-3xl border-2 border-input bg-background px-4 py-3 text-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
							rows={2}
						></textarea>
						<div className="flex flex-wrap items-center gap-3">
							<Button type="submit" variant="accent" size="lg" className="flex items-center gap-2">
								<Send className="w-5 h-5" />
								Отправить
							</Button>
							<div className="flex flex-wrap gap-2">
								{quickPrompts.map((prompt) => (
									<Button
										key={prompt}
										type="button"
										variant="outline"
										size="sm"
										onClick={() => sendMessage(prompt)}
									>
										{prompt}
									</Button>
								))}
							</div>
						</div>
					</form>
				</section>

				<aside className="space-y-4">
					<Card className="rounded-3xl">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Sparkles className="w-5 h-5 text-primary" />Как работает помощник
							</CardTitle>
							<CardDescription>Сравниваем ваш профиль, регион и историю обращений. Подсказываем льготы, документы и сроки.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3 text-sm text-muted-foreground">
							<p className="flex items-center gap-2">
								<Heart className="w-4 h-4 text-primary" /> Персональные льготы по категории
							</p>
							<p className="flex items-center gap-2">
								<Clock3 className="w-4 h-4 text-primary" /> Напоминания об истечении сроков
							</p>
							<p className="flex items-center gap-2">
								<Sparkles className="w-4 h-4 text-primary" /> Подбор документов и шагов
							</p>
						</CardContent>
					</Card>

					<Card className="rounded-3xl bg-secondary">
						<CardHeader>
							<CardTitle>Остались вопросы?</CardTitle>
							<CardDescription>Можно перейти в простой режим или распечатать подсказки.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<Button variant="outline" size="lg" asChild className="w-full">
								<Link to="/simple">Простой режим</Link>
							</Button>
							<Button variant="ghost" size="lg" asChild className="w-full text-primary">
								<Link to="/print">Печать памятки</Link>
							</Button>
						</CardContent>
					</Card>
				</aside>
			</div>
		</Layout>
	);
};
