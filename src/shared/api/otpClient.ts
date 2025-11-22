export const OTP_API_URL =
	import.meta.env.VITE_OTP_API_URL || 'https://otp-valhalla.vercel.app';

export type OtpQrBlock = {
	payload: string;
	dataUrl: string;
};

export type OtpRequestResponse = {
	requestId: string;
	mock?: boolean;
	mockCode?: string;
	expiresIn?: number;
	qr?: OtpQrBlock;
	reportCaptured?: boolean;
};

export type OtpVerifyResponse = {
	success: boolean;
	phone: string;
	mock?: boolean;
	supabaseUserId?: string | null;
	supabaseUserCreated?: boolean;
};

export async function postToOtpApi<T>(
	path: string,
	body: Record<string, unknown>
): Promise<T> {
	const response = await fetch(`${OTP_API_URL}${path}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const payload = await response.json().catch(() => ({}));
		const message =
			typeof payload === 'object' && payload && 'message' in payload
				? (payload as { message?: string }).message
				: null;
		throw new Error(message || 'Не удалось выполнить запрос к OTP API');
	}

	return response.json() as Promise<T>;
}

export type RequestOtpOptions = {
	report?: unknown;
};

export function requestOtpCode(phone: string, options: RequestOtpOptions = {}) {
	const payload: Record<string, unknown> = { phone };
	if (options.report !== undefined) {
		payload.report = options.report;
	}

	return postToOtpApi<OtpRequestResponse>('/otp/request', payload);
}

export function verifyOtpCode(requestId: string, code: string) {
	return postToOtpApi<OtpVerifyResponse>('/otp/verify', { requestId, code });
}
