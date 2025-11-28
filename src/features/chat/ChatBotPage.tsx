import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Layout } from '@/shared/ui/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { useAppStore } from '@/shared/store/useAppStore';
import { benefitsApi } from '@/shared/api/benefitsApi';
import { medicinesApi } from '@/shared/api/medicinesApi';
import { Benefit } from '@/shared/types';
import { formatCurrency } from '@/shared/lib/formatters';
import { normalizeTargetGroup } from '@/shared/lib/targetGroups';
import { cn } from '@/lib/utils';
import {
	MessageCircle,
	Send,
	Sparkles,
	Heart,
	Clock3,
	BrainCircuit,
	LayoutDashboard,
	Heart as HeartIcon,
	Pill,
	FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChatMessage {
	id: string;
	role: 'assistant' | 'user' | 'ai';
	text: string;
	timestamp: string;
	highlights?: Benefit[];
}

const quickPrompts = [
	'Какие льготы доступны пенсионеру?',
	'Нужна скидка на лекарства',
	'Какие документы нужны для оплаты ЖКХ',
	'Подскажи про бесплатный проезд',
	'Что истекает в моём регионе',
];

type LangCode = 'ru' | 'en' | 'unknown';

export const ChatBotPage = () => {
	const { benefits, setBenefits, user, medicines, setMedicines } = useAppStore();
	const [input, setInput] = useState('');
	const [aiEnabled, setAiEnabled] = useState(true);
	const [detectingLang, setDetectingLang] = useState(false);
	const [lastDetectedLang, setLastDetectedLang] = useState<LangCode>('ru');
	const [messages, setMessages] = useState<ChatMessage[]>(() => [
		{
			id: 'assistant-hello',
			role: 'assistant',
			text: 'Здравствуйте! Я ассистент Руки помощи. Задайте вопрос — подскажу льготы, сроки и документы.',
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
		if (medicines.length === 0) {
			medicinesApi
				.getAll()
				.then(setMedicines)
				.catch((error) => console.error('Failed to load medicines for chat:', error));
		}
	}, [medicines.length, setMedicines]);

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

	const translate = (lang: LangCode, ru: string, en: string) =>
		lang === 'en' ? en : ru;

	const detectLanguage = async (text: string): Promise<LangCode> => {
		if (!text) return 'ru';
		const hasCyrillic = /[а-яё]/i.test(text);
		const hasLatin = /[a-z]/i.test(text);
		const heuristic = hasCyrillic && !hasLatin ? 'ru' : hasLatin && !hasCyrillic ? 'en' : 'unknown';

		const apiKey = import.meta.env.VITE_YANDEX_TRANSLATE_API_KEY;
		if (!apiKey) {
			return heuristic;
		}

		try {
			const response = await fetch('https://translate.api.cloud.yandex.net/translate/v2/detect', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Api-Key ${apiKey}`,
				},
				body: JSON.stringify({ text }),
			});

			if (!response.ok) {
				throw new Error(`Yandex detect failed: ${response.status}`);
			}

			const data = await response.json();
			const code: string | undefined =
				data?.languageCode || data?.lang || data?.detectedLanguageCode;

			if (!code) return heuristic;
			if (code.startsWith('ru')) return 'ru';
			if (code.startsWith('en')) return 'en';
			return 'unknown';
		} catch (error) {
			console.error('Language detection error:', error);
			return heuristic;
		}
	};

	const buildAssistantReply = (question: string, lang: LangCode): ChatMessage => {
		const normalized = question.toLowerCase();
		const matched = accessibleBenefits
			.filter((benefit) =>
				benefit.title.toLowerCase().includes(normalized) ||
				benefit.description.toLowerCase().includes(normalized) ||
				benefit.type.toLowerCase().includes(normalized)
			)
			.slice(0, 3);

		const text = matched.length
			? translate(
				lang,
				`Я подобрала ${matched.length} подходящих льготы. Посмотрите описание и шаги, а если нужна помощь с документами — нажмите кнопку «Подробнее».`,
				`I found ${matched.length} matching benefits. Open details to see steps and documents.`
			)
			: translate(
				lang,
				'Я записала ваш вопрос и сохраню его в истории. Пока не нашла точную льготу, но могу подсказать по документам или отправить в профиль.',
				"I've saved your question. No exact benefit yet, but I can suggest documents or open the catalog."
			);

		return {
			id: `assistant-${Date.now()}`,
			role: 'assistant',
			text,
			timestamp: new Date().toISOString(),
			highlights: matched,
		};
	};

	const buildAiReply = (question: string, lang: LangCode): ChatMessage => {
		const normalized = question.toLowerCase();
		const matched = accessibleBenefits
			.filter((benefit) =>
				benefit.title.toLowerCase().includes(normalized) ||
				benefit.description.toLowerCase().includes(normalized) ||
				benefit.type.toLowerCase().includes(normalized)
			)
			.slice(0, 3);

		const regionLabel = user?.region || 'ваш регион';
		const categoryLabel = normalizedUserCategory || 'не указана';

		const expiringSoon = accessibleBenefits
			.filter((benefit) => typeof benefit.expiresIn === 'number' && benefit.expiresIn <= 60)
			.sort((a, b) => (a.expiresIn ?? Number.MAX_SAFE_INTEGER) - (b.expiresIn ?? Number.MAX_SAFE_INTEGER));

		const totalSavings = accessibleBenefits.reduce(
			(sum, benefit) => sum + (benefit.savingsPerMonth ?? 0),
			0
		);

		const medsCount = medicines.length;
		const medsPreview = medicines.slice(0, 3).map((med) => med.name).join(', ');

		const top = matched[0];
		const stepsPreview = top?.steps?.slice(0, 2).join('; ');
		const docsPreview = top?.documents?.slice(0, 2).join(', ');

		const summaryParts: string[] = [];
		summaryParts.push(
			translate(
				lang,
				`Регион: ${regionLabel}, категория: ${categoryLabel}. Льгот ${accessibleBenefits.length}${accessibleBenefits.some((b) => b.isNew) ? ', есть новые' : ''}.`,
				`Region: ${regionLabel}, category: ${categoryLabel}. Benefits available: ${accessibleBenefits.length}${accessibleBenefits.some((b) => b.isNew) ? ', new ones detected' : ''}.`
			)
		);
		summaryParts.push(
			expiringSoon[0]
				? translate(
					lang,
					`Сроки: "${expiringSoon[0].title}" истекает через ${expiringSoon[0].expiresIn} дн.`,
					`Deadlines: "${expiringSoon[0].title}" ends in ${expiringSoon[0].expiresIn} days.`
				)
				: translate(lang, 'Сроки: срочных льгот нет.', 'Deadlines: nothing urgent.')
		);
		summaryParts.push(
			medsCount > 0
				? translate(
					lang,
					`Лекарства: ${medsCount} в аптечке (${medsPreview}).`,
					`Medicines: ${medsCount} tracked (${medsPreview}).`
				)
				: translate(lang, 'Лекарства: не добавлены.', 'Medicines: none added.')
		);
		summaryParts.push(
			totalSavings > 0
				? translate(
					lang,
					`Суммарная потенциальная экономия ~${formatCurrency(totalSavings)}/мес.`,
					`Estimated monthly savings ~${formatCurrency(totalSavings)}.`
				)
				: translate(
					lang,
					'Экономия уточняется после проверки сумм выплат.',
					'Savings will appear after benefit amounts are confirmed.'
				)
		);

		const matchedText = top
			? translate(
				lang,
				`По запросу подходит: ${top.title}. Шаги: ${stepsPreview || 'открыть карточку и следовать инструкции'}. Документы: ${docsPreview || 'паспорт и СНИЛС'}.`,
				`Match for your query: ${top.title}. Steps: ${stepsPreview || 'open the benefit and follow the instructions'}. Documents: ${docsPreview || 'passport and SNILS/ID'}.`
			)
			: translate(
				lang,
				'По запросу точного совпадения нет — могу подсказать по документам или открыть каталог льгот.',
				'No exact match for this query — I can suggest documents or open the benefits catalog.'
			);

		const text = translate(
			lang,
			`ИИ сверила профиль. ${summaryParts.join(' ')} ${matchedText}`,
			`AI checked your profile. ${summaryParts.join(' ')} ${matchedText}`
		);

		return {
			id: `ai-${Date.now()}`,
			role: 'ai',
			text,
			timestamp: new Date().toISOString(),
			highlights: matched,
		};
	};

	const sendMessage = async (text: string) => {
		const trimmed = text.trim();
		if (!trimmed) return;

		const userMessage: ChatMessage = {
			id: `user-${Date.now()}`,
			role: 'user',
			text: trimmed,
			timestamp: new Date().toISOString(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setDetectingLang(true);
		const detected = await detectLanguage(trimmed);
		setDetectingLang(false);
		setLastDetectedLang(detected === 'unknown' ? 'ru' : detected);

		const reply = buildAssistantReply(trimmed, detected === 'unknown' ? 'ru' : detected);
		const aiReply = aiEnabled ? buildAiReply(trimmed, detected === 'unknown' ? 'ru' : detected) : null;
		setMessages((prev) => [...prev, reply, ...(aiReply ? [aiReply] : [])]);
		setInput('');
	};

	const handleSend = (event?: FormEvent) => {
		if (event) event.preventDefault();
		void sendMessage(input);
	};

	const renderBubble = (message: ChatMessage) => {
		const isUser = message.role === 'user';
		const isAi = message.role === 'ai';
		const label = isUser ? 'Вы' : isAi ? 'ИИ' : 'Ассистент';
		const bubbleClasses = cn(
			'rounded-3xl px-4 py-3 max-w-2xl shadow-sm border',
			isUser && 'bg-primary text-primary-foreground border-primary/20 ml-auto',
			!isUser && isAi && 'bg-emerald-50 border-emerald-200 text-emerald-900',
			!isUser && !isAi && 'bg-white border-border/60'
		);

		return (
			<div className={cn('flex flex-col gap-2', isUser ? 'items-end' : 'items-start')} key={message.id}>
				<div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
					<span>{label}</span>
					<span>•</span>
					<span>{new Date(message.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
				</div>
				<div className={bubbleClasses}>
					<p className="text-base leading-relaxed whitespace-pre-wrap">{message.text}</p>
					{message.highlights && message.highlights.length > 0 && (
						<div className="mt-3 space-y-2">
							{message.highlights.map((benefit) => (
								<div key={benefit.id} className="rounded-2xl bg-white/80 border border-border/70 p-3 text-sm">
									<p className="font-semibold">{benefit.title}</p>
									<p className="text-muted-foreground text-sm">{benefit.description}</p>
									<div className="mt-2 flex items-center justify-between">
										{benefit.savingsPerMonth && <span className="text-primary font-semibold">{formatCurrency(benefit.savingsPerMonth)}/мес</span>}
										<Button variant="link" size="sm" asChild className="px-0">
											<Link to={`/benefits/${benefit.id}`}>Подробнее</Link>
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		);
	};

	return (
		<Layout title="Чат-бот Рука помощи">
			<div className="grid gap-6 lg:grid-cols-[2fr,1fr] pb-16 md:pb-24">
				<section className="rounded-3xl border border-border/80 bg-white p-4 md:p-6 flex flex-col">
					<div className="flex items-center gap-3 mb-4">
						<div className="rounded-full bg-primary/10 p-3 text-primary border border-primary/20">
							<MessageCircle className="w-6 h-6" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-xl font-semibold leading-tight">Живой чат с ассистентом</p>
							<p className="text-sm text-muted-foreground">Вопросы о льготах, документах и сроках — отвечаем прямо здесь.</p>
						</div>
						<div className="flex flex-col items-end gap-1">
							<Button
								type="button"
								variant={aiEnabled ? 'accent' : 'outline'}
								size="sm"
								className="flex items-center gap-2"
								onClick={() => setAiEnabled((prev) => !prev)}
							>
								<BrainCircuit className="w-4 h-4" />
								ИИ {aiEnabled ? 'включён' : 'выключен'}
							</Button>
							<p className="text-[11px] text-muted-foreground">Язык: {detectingLang ? 'определяем…' : lastDetectedLang === 'en' ? 'English' : 'Русский'}</p>
						</div>
					</div>

					<div className="flex-1 rounded-2xl border border-border/60 bg-gradient-to-b from-slate-50 to-white p-3 md:p-4 flex flex-col gap-3">
						<div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
							<span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
							<span>На связи</span>
							<span>•</span>
							<span>Ответы учитывают ваш профиль</span>
						</div>
						<div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1">
							{messages.map(renderBubble)}
						</div>
						<form onSubmit={handleSend} className="rounded-2xl border border-border/70 bg-white shadow-sm p-3 space-y-3">
							<label className="flex flex-col gap-2 text-sm text-muted-foreground">
								<span>Ваш вопрос</span>
								<textarea
									value={input}
									onChange={(e) => setInput(e.target.value)}
									placeholder="Например: какие скидки на лекарства в моём регионе"
									className="w-full rounded-2xl border-2 border-input bg-background px-4 py-3 text-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
									rows={2}
								></textarea>
							</label>
							<div className="flex flex-wrap items-center gap-2">
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
					</div>
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
