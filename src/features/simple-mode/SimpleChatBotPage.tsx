import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { useAppStore } from '@/shared/store/useAppStore';
import { benefitsApi } from '@/shared/api/benefitsApi';
import { Benefit } from '@/shared/types';
import { normalizeTargetGroup } from '@/shared/lib/targetGroups';
import { formatCurrency } from '@/shared/lib/formatters';
import SimpleShell from './SimpleShell';

interface Message {
	id: string;
	role: 'assistant' | 'user';
	text: string;
}

const prompts = [
	'Какие льготы мне доступны',
	'Скидка на лекарства',
	'Что истекает скоро',
	'Документы для оплаты ЖКХ',
];

export const SimpleChatBotPage = () => {
	const { user, benefits, setBenefits } = useAppStore();
	const [input, setInput] = useState('');
	const [loading, setLoading] = useState(false);
	const [messages, setMessages] = useState<Message[]>([
		{
			id: 'hello',
			role: 'assistant',
			text: 'Здравствуйте! Напишите, что нужно подсказать. Я покажу подходящие льготы и ссылки.',
		},
	]);

	useEffect(() => {
		if (benefits.length || loading) return;
		setLoading(true);
		benefitsApi
			.getForProfile(user)
			.then(setBenefits)
			.finally(() => setLoading(false));
	}, [benefits.length, loading, setBenefits, user]);

	const normalizedUserCategory = user ? normalizeTargetGroup(user.category) : null;

	const accessibleBenefits = useMemo(() => {
		if (!user) return benefits;
		return benefits.filter((benefit: Benefit) => {
			const matchesRegion = benefit.regions.includes(user.region) || benefit.regions.includes('all');
			const matchesCategory = !normalizedUserCategory || benefit.targetGroups.includes(normalizedUserCategory);
			return matchesRegion && matchesCategory;
		});
	}, [benefits, normalizedUserCategory, user]);

	const sendMessage = (text: string) => {
		const trimmed = text.trim();
		if (!trimmed) return;

		const userMessage: Message = {
			id: `user-${Date.now()}`,
			role: 'user',
			text: trimmed,
		};

		const matched = accessibleBenefits.slice(0, 3);
		const savings = matched.reduce((sum, item) => sum + (item.savingsPerMonth ?? 0), 0);
		const replyParts: string[] = [];
		replyParts.push(
			matched.length
				? `Нашла ${matched.length} подходящих льготы.`
				: 'Записала запрос. Пока не нашла точную льготу — откройте список, чтобы посмотреть всё доступное.'
		);
		if (savings) {
			replyParts.push(`Потенциальная экономия ~${formatCurrency(savings)}/мес.`);
		}
		if (matched[0]?.expiresIn) {
			replyParts.push(`Срочно: «${matched[0].title}» истекает через ${matched[0].expiresIn} дней.`);
		}
		replyParts.push('Откройте льготы или спросите оператора 122.');

		const assistantMessage: Message = {
			id: `assistant-${Date.now()}`,
			role: 'assistant',
			text: replyParts.join(' '),
		};

		setMessages((prev) => [...prev, userMessage, assistantMessage]);
		setInput('');
	};

	const handleSend = (event?: FormEvent) => {
		if (event) event.preventDefault();
		sendMessage(input);
	};

	return (
		<SimpleShell
			title="Ассистент просто"
			description="Крупный текст, подсказки и быстрые кнопки."
		>
			<div className="space-y-4">
				<div className="rounded-3xl bg-white/90 border border-border/70 p-4 space-y-3 max-h-[420px] overflow-y-auto">
					{messages.map((message) => (
						<div
							key={message.id}
							className={`rounded-2xl px-3 py-2 text-base leading-relaxed ${
								message.role === 'assistant'
									? 'bg-primary/10 text-foreground'
									: 'bg-accent/10 text-foreground'
							}`}
						>
							{message.text}
						</div>
					))}
				</div>

				<form onSubmit={handleSend} className="space-y-3">
					<textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Например: какие выплаты истекают"
						className="w-full rounded-3xl border-2 border-input bg-background px-4 py-3 text-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
						rows={2}
					></textarea>
					<div className="flex flex-wrap gap-2">
						<Button type="submit" variant="accent" size="lg" className="h-auto px-6 py-3">
							Отправить
						</Button>
						{prompts.map((prompt) => (
							<Button key={prompt} type="button" variant="outline" size="sm" onClick={() => sendMessage(prompt)}>
								{prompt}
							</Button>
						))}
					</div>
				</form>

				<div className="grid gap-3 md:grid-cols-2">
					<Button variant="accent" size="xl" asChild className="h-auto py-4">
						<a href="#/benefits">Открыть льготы</a>
					</Button>
					<Button variant="outline" size="xl" asChild className="h-auto py-4">
						<a href="#/print">Печать памятки</a>
					</Button>
				</div>

				{loading && <p className="text-sm text-muted-foreground">Загружаем данные...</p>}
			</div>
		</SimpleShell>
	);
};

export default SimpleChatBotPage;
