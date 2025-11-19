import { supabase } from '@/shared/lib/supabaseClient';

const OTP_API_URL =
	import.meta.env.VITE_OTP_API_URL || 'http://localhost:4000';

export type VerificationChannel = 'sms' | 'email';

export type SendVerificationCodeParams = {
	recipient: string;
	channel: VerificationChannel;
};

export type VerifyCodeParams = SendVerificationCodeParams & {
	code: string;
	requestId?: string | null;
};

export type SendVerificationResponse = {
	requestId?: string | null;
	normalizedRecipient: string;
	mockCode?: string | null;
};

export type SmsVerifyResponse = {
	success: boolean;
	phone: string;
	mock?: boolean;
	supabaseUserId?: string | null;
	supabaseUserCreated?: boolean;
};

export function normalizePhoneToE164(raw: string): string {
	const trimmed = raw.trim();
	if (!trimmed) return '';
	if (trimmed.startsWith('+')) return trimmed;

	const digits = trimmed.replace(/\D/g, '');
	if (!digits) return '';

	if (digits.length === 11 && digits.startsWith('8')) {
		return `+7${digits.slice(1)}`;
	}

	if (digits.length === 10 && digits.startsWith('9')) {
		return `+7${digits}`;
	}

	if (digits.length === 11 && digits.startsWith('7')) {
		return `+${digits}`;
	}

	return `+${digits}`;
}

export function isValidPhone(raw: string): boolean {
	const normalized = normalizePhoneToE164(raw);
	return /^\+\d{10,15}$/.test(normalized);
}

type OtpRequestResponse = {
	requestId: string;
	mock?: boolean;
	mockCode?: string;
	expiresIn?: number;
};

type OtpVerifyResponse = SmsVerifyResponse;

async function postToOtpApi<T>(path: string, body: Record<string, unknown>) {
	const response = await fetch(`${OTP_API_URL}${path}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const payload = await response.json().catch(() => ({}));
		throw new Error(
			payload.message || 'Не удалось выполнить запрос для отправки кода'
		);
	}

	return response.json() as Promise<T>;
}

export async function sendVerificationCode({
	recipient,
	channel,
}: SendVerificationCodeParams): Promise<SendVerificationResponse> {
	if (channel === 'email') {
		const { error } = await supabase.auth.signInWithOtp({
			email: recipient.trim(),
			options: {
				shouldCreateUser: true,
				emailRedirectTo: window.location.origin,
			},
		});

		if (error) {
			console.error('sendVerificationCode email error:', error);
			throw error;
		}

		return {
			normalizedRecipient: recipient.trim(),
			requestId: null,
			mockCode: null,
		};
	}

	const phone = normalizePhoneToE164(recipient);
	if (!phone) {
		throw new Error('Проверь номер телефона');
	}

	const response = await postToOtpApi<OtpRequestResponse>(
		'/otp/request',
		{
			phone,
		}
	);

	return {
		requestId: response.requestId,
		normalizedRecipient: phone,
		mockCode: response.mockCode ?? null,
	};
}

export async function verifyCode({
	recipient,
	channel,
	code,
	requestId,
}: VerifyCodeParams) {
	if (channel === 'email') {
		const { data, error } = await supabase.auth.verifyOtp({
			email: recipient.trim(),
			token: code,
			type: 'email',
		});

		if (error) {
			console.error('verifyCode email error:', error);
			throw error;
		}

		return data;
	}

	if (!requestId) {
		throw new Error('Отсутствует идентификатор запроса. Запросите код снова.');
	}

	return postToOtpApi<OtpVerifyResponse>('/otp/verify', {
		requestId,
		code,
	});
}
