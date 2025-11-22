import { useEffect, useRef, useState } from 'react';
import {
	VerificationChannel,
	SmsVerifyResponse,
	isValidPhone,
	sendVerificationCode,
	verifyCode,
} from '../api/verification';
import { useAuth } from '../AuthContext';

type Props = {
	onSuccess?: () => void;
};

type Step = 'enterRecipient' | 'enterCode';

export function OtpForm({ onSuccess }: Props) {
	const [step, setStep] = useState<Step>('enterRecipient');
	const [recipient, setRecipient] = useState('');
	const [channel, setChannel] = useState<VerificationChannel>('sms');
	const [code, setCode] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [requestId, setRequestId] = useState<string | null>(null);

	// ДОБАВЛЕНО: берём refreshProfile из AuthContext
	const { setManualUser, refreshProfile } = useAuth();

	const mockFillTimeouts = useRef<number[]>([]);

	const clearMockFill = () => {
		mockFillTimeouts.current.forEach((id) => window.clearTimeout(id));
		mockFillTimeouts.current = [];
	};

	const animateMockCode = (value: string) => {
		clearMockFill();
		setCode('');

		value.split('').forEach((char, index) => {
			const timeoutId = window.setTimeout(() => {
				setCode((prev) => `${prev}${char}`);
			}, index * 120);
			mockFillTimeouts.current.push(timeoutId);
		});
	};

	useEffect(() => clearMockFill, []);

	const requestCode = async () => {
		setLoading(true);
		setError(null);

		try {
			if (channel === 'sms' && !isValidPhone(recipient)) {
				throw new Error('Введите корректный номер телефона');
			}

			const { normalizedRecipient, requestId, mockCode } =
				await sendVerificationCode({
					recipient,
					channel,
				});

			setRecipient(normalizedRecipient);
			setRequestId(requestId ?? null);
			setStep('enterCode');

			if (mockCode) {
				animateMockCode(mockCode);
			} else {
				clearMockFill();
				setCode('');
			}
		} catch (err) {
			const message =
				err instanceof Error ? err.message : 'Не удалось отправить код';
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyCode = async () => {
		setLoading(true);
		setError(null);

		try {
			const result = await verifyCode({ recipient, channel, code, requestId });

			if (channel === 'sms') {
				const smsResult = result as SmsVerifyResponse;

				// важно: бэкенд уже сделал ensureSupabaseUser и вернул uuid
				const supabaseUserId = smsResult?.supabaseUserId;

				if (!supabaseUserId) {
					throw new Error('Не удалось создать или найти аккаунт по этому номеру');
				}

				// 1) Сохраняем manualUser с НАСТОЯЩИМ uuid (не sms:+...)
				setManualUser({
					id: supabaseUserId,
					phone: smsResult.phone ?? recipient,
				});

				// 2) Синхронизируем профиль через profilesApi.ensureProfile
				await refreshProfile();
			}

			if (onSuccess) onSuccess();
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Неверный код';
			setError(message);
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
							onChange={() => {
								setChannel('sms');
								setRequestId(null);
								clearMockFill();
							}}
						/>
						SMS
					</label>
					<label className="flex items-center gap-1">
						<input
							type="radio"
							className="h-3 w-3"
							checked={channel === 'email'}
							onChange={() => {
								setChannel('email');
								setRequestId(null);
								clearMockFill();
							}}
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
				onClick={handleVerifyCode}
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
					setRequestId(null);
					clearMockFill();
				}}
				className="w-full text-xs text-gray-500 hover:text-gray-700"
			>
				Изменить номер / почту
			</button>
		</div>
	);
}
