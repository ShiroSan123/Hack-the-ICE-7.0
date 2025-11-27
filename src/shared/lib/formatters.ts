export const formatDate = (dateString: string | null): string => {
	if (!dateString) return 'Бессрочно';

	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return '—';

	try {
		return date.toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	} catch {
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();
		return `${day}.${month}.${year}`;
	}
};

export const formatCurrency = (amount: number): string => {
	try {
		return new Intl.NumberFormat('ru-RU', {
			style: 'currency',
			currency: 'RUB',
			maximumFractionDigits: 0,
		}).format(amount);
	} catch {
		return `${Math.round(amount)} ₽`;
	}
};

export const formatSnils = (snils: string): string => {
	const cleaned = snils.replace(/\D/g, '');
	const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
	if (match) {
		return `${match[1]}-${match[2]}-${match[3]} ${match[4]}`;
	}
	return snils;
};

export const calculateDaysUntil = (dateString: string): number => {
	const date = new Date(dateString);
	const now = new Date();
	const diff = date.getTime() - now.getTime();
	if (Number.isNaN(diff)) return 0;
	return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
