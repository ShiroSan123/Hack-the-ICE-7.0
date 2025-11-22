import { requestOtpCode, verifyOtpCode, type OtpVerifyResponse } from '@/shared/api/otpClient';
import { normalizePhoneToE164, isValidPhone } from '@/shared/lib/phone';
import { supabase } from '@/shared/lib/supabaseClient';

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

export type SmsVerifyResponse = OtpVerifyResponse;
export { normalizePhoneToE164, isValidPhone };

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

	const response = await requestOtpCode(phone);

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

	return verifyOtpCode(requestId, code);
}
