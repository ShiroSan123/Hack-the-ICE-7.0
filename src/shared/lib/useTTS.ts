import { useCallback, useEffect, useMemo, useState } from 'react';

export const useTTS = () => {
	const [speaking, setSpeaking] = useState(false);
	const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
	const available = useMemo(() => {
		if (typeof window === 'undefined') return false;
		return typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined';
	}, []);

	useEffect(() => {
		if (!available) return;

		const loadVoices = () => {
			const availableVoices = window.speechSynthesis.getVoices();
			setVoices(availableVoices);
		};

		loadVoices();
		window.speechSynthesis.onvoiceschanged = loadVoices;

		return () => {
			window.speechSynthesis.cancel();
		};
	}, [available]);

	const speak = useCallback((text: string) => {
		if (!available) return;
		if (!text) return;

		// Cancel any ongoing speech
		window.speechSynthesis.cancel();

		const utterance = new SpeechSynthesisUtterance(text);

		// Try to find Russian voice
		const russianVoice = voices.find(
			(voice) => voice.lang.startsWith('ru') || voice.lang.includes('Russian')
		);

		if (russianVoice) {
			utterance.voice = russianVoice;
		}

		utterance.lang = 'ru-RU';
		utterance.rate = 0.9; // Slightly slower for seniors
		utterance.pitch = 1;
		utterance.volume = 1;

		utterance.onstart = () => setSpeaking(true);
		utterance.onend = () => setSpeaking(false);
		utterance.onerror = () => setSpeaking(false);

		window.speechSynthesis.speak(utterance);
	}, [available, voices]);

	const stop = useCallback(() => {
		if (!available) return;
		window.speechSynthesis.cancel();
		setSpeaking(false);
	}, [available]);

	return { speak, stop, speaking, available };
};
