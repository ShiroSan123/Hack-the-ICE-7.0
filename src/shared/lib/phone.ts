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
