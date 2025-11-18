import { useState } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';

type Props = {
	onSuccess?: () => void;
};

type Step = 'enterRecipient' | 'enterCode';

export function OtpForm({ onSuccess }: Props) {
	const [step, setStep] = useState<Step>('enterRecipient');
	const [recipient, setRecipient] = useState('');
	const [channel, setChannel] = useState<'sms' | 'email'>('sms');
	const [code, setCode] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	function normalizePhoneToE164(raw: string): string {
		const trimmed = raw.trim();
		if (trimmed.startsWith('+')) return trimmed;

		const digits = trimmed.replace(/\D/g, '');
		if (!digits) return '';

		if (digits.length === 11 && digits.startsWith('8')) {
			return `+7${digits.slice(1)}`;
		}

		if (digits.length === 10 && digits.startsWith('9')) {
			return `7${digits}`;
		}

		if (digits.length === 11 && digits.startsWith('7')) {
			return `${digits}`;
		}

		return `${digits}`;
	}

	const requestCode = async () => {
		setLoading(true);
		setError(null);

		try {
			if (channel === 'email') {
				const { error } = await supabase.auth.signInWithOtp({
					email: recipient.trim(),
					options: { shouldCreateUser: true },
				});
				if (error) throw error;
			} else {
				const normalized = normalizePhoneToE164(recipient);
				if (!normalized) throw new Error('Проверь номер телефона');

				const { error } = await supabase.auth.signInWithOtp({
					phone: normalized,
					options: { channel: 'sms', shouldCreateUser: true },
				});
				if (error) throw error;

				// перезаписываем, чтобы verifyOtp использовал тот же номер
				setRecipient(normalized);
			}

			setStep('enterCode');
		} catch (e: any) {
			setError(e.message ?? 'Не удалось отправить код');
		} finally {
			setLoading(false);
		}
	};


	const verifyCode = async () => {
		setLoading(true);
		setError(null);

		try {
			if (channel === 'email') {
				const { data, error } = await supabase.auth.verifyOtp({
					email: recipient,
					token: code,
					type: 'email', // важная правка
				});
				if (error) throw error;
				// data.session уже есть, если всё ок
			} else {
				const normalized = recipient
					.replace(/\D/g, '')
					.replace(/^8/, '7');

				const e164 = `+${normalized}`;
				const { data, error } = await supabase.auth.verifyOtp({
					phone: e164,
					token: code,
					type: 'sms',
				});
				if (error) throw error;
				// data.session тоже должна прийти
			}

			if (onSuccess) onSuccess();
		} catch (e: any) {
			setError(e.message ?? 'Неверный код');
		} finally {
			setLoading(false);
		}
	};

	if (step === 'enterRecipient') {
		return (
			<div className="space-y-3">
				<label className="flex flex-col gap-1">
					<span className="text-sm font-medium">Телефон или почта</span>
					<input
						className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
						placeholder="+41 79 000 00 00 или email"
						value={recipient}
						onChange={(e) => setRecipient(e.target.value)}
					/>
				</label>

				<div className="flex gap-3 text-xs text-gray-600">
					<label className="flex items-center gap-1">
						<input
							type="radio"
							className="h-3 w-3"
							checked={channel === 'sms'}
							onChange={() => setChannel('sms')}
						/>
						SMS
					</label>
					<label className="flex items-center gap-1">
						<input
							type="radio"
							className="h-3 w-3"
							checked={channel === 'email'}
							onChange={() => setChannel('email')}
						/>
						Email
					</label>
				</div>

				<button
					type="button"
					onClick={requestCode}
					disabled={loading || !recipient}
					className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
				>
					{loading ? 'Отправляем код…' : 'Получить код'}
				</button>

				{error && <p className="text-xs text-red-500">{error}</p>}
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<p className="text-sm text-gray-600">
				Мы отправили код на{' '}
				<span className="font-medium">{recipient}</span>
			</p>
			<input
				className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm tracking-[0.3em] text-center md:text-lg focus:border-black focus:outline-none"
				placeholder="• • • • • •"
				value={code}
				onChange={(e) => setCode(e.target.value)}
				maxLength={6}
			/>
			<button
				type="button"
				onClick={verifyCode}
				disabled={loading || code.length < 6}
				className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
			>
				{loading ? 'Проверяем…' : 'Подтвердить'}
			</button>
			{error && <p className="text-xs text-red-500">{error}</p>}
			<button
				type="button"
				onClick={() => {
					setStep('enterRecipient');
					setCode('');
				}}
				className="w-full text-xs text-gray-500 hover:text-gray-700"
			>
				Изменить номер / почту
			</button>
		</div>
	);
}
