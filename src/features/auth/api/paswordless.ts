import { supabase } from '../../../shared/lib/supabaseClient';

export async function sendEmailOtp(email: string) {
	const { data, error } = await supabase.auth.signInWithOtp({
		email,
		options: {
			emailRedirectTo: window.location.origin,
		},
	});

	if (error) {
		console.error('sendEmailOtp error:', error);
		throw error;
	}

	return data;
}

export async function verifyEmailOtp(email: string, token: string) {
	const { data, error } = await supabase.auth.verifyOtp({
		email,
		token,
		type: 'email',
	});

	if (error) {
		console.error('verifyEmailOtp error:', error);
		throw error;
	}

	return data;
}

export async function sendSmsOtp(phone: string) {
	// phone – в формате E.164, например: +41790000000
	const { data, error } = await supabase.auth.signInWithOtp({
		phone,
	});

	if (error) {
		console.error('sendSmsOtp error:', error);
		throw error;
	}

	return data;
}

export async function verifySmsOtp(phone: string, token: string) {
	const { data, error } = await supabase.auth.verifyOtp({
		phone,
		token,
		type: 'sms', // для телефона – "sms"
	});

	if (error) {
		console.error('verifySmsOtp error:', error);
		throw error;
	}

	return data;
}
