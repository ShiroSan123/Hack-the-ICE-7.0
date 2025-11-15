import { useCallback, useEffect, useState } from 'react';

export const useTTS = () => {
	const [speaking, setSpeaking] = useState(false);
	const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

	useEffect(() => {
		const loadVoices = () => {
			const availableVoices = window.speechSynthesis.getVoices();
			setVoices(availableVoices);
		};

		loadVoices();
		window.speechSynthesis.onvoiceschanged = loadVoices;

		return () => {
			window.speechSynthesis.cancel();
		};
	}, []);

	const speak = useCallback((text: string) => {
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
	}, [voices]);

	const stop = useCallback(() => {
		window.speechSynthesis.cancel();
		setSpeaking(false);
	}, []);

	return { speak, stop, speaking };
};
