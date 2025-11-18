import { useState } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { OtpForm } from './OtpForm';

type Props = {
	onClose: () => void;
};

type Method = 'gosuslugi' | 'google' | 'otp';

export function AuthModal({ onClose }: Props) {
	const [method, setMethod] = useState<Method>('otp');

	const handleGosuslugi = () => {
		window.location.href = '/api/auth/gosuslugi/redirect';
	};

	const handleGoogle = async () => {
		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: 'google',
				options: {
					redirectTo: window.location.origin,
				},
			});
			if (error) console.error('OAuth error:', error);
		} catch (e) {
			console.error('Unexpected OAuth error:', e);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
			<div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold">Вход / регистрация</h2>
					{/* <button onClick={onClose}>✕</button> */}
				</div>

				<div className="flex gap-2 mb-4">
					<button
						onClick={() => setMethod('otp')}
						className={`flex-1 rounded-md px-3 py-2 text-sm ${method === 'otp'
							? 'bg-black text-white'
							: 'bg-gray-100 text-gray-700'
							}`}
					>
						Телефон / почта
					</button>
					<button
						onClick={() => setMethod('gosuslugi')}
						className={`flex-1 rounded-md px-3 py-2 text-sm ${method === 'gosuslugi'
							? 'bg-black text-white'
							: 'bg-gray-100 text-gray-700'
							}`}
					>
						Госуслуги
					</button>
					<button
						onClick={() => setMethod('google')}
						className={`flex-1 rounded-md px-3 py-2 text-sm ${method === 'google'
							? 'bg-black text-white'
							: 'bg-gray-100 text-gray-700'
							}`}
					>
						Google
					</button>
				</div>

				{method === 'otp' && (
					<OtpForm
						onSuccess={onClose} // просто закрываем модалку после успешной верификации
					/>
				)}

				{method === 'gosuslugi' && (
					<div className="space-y-3">
						<p className="text-sm text-gray-600">
							Авторизация через ЕСИА на портале Госуслуг.
						</p>
						<button
							onClick={handleGosuslugi}
							className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
						>
							Войти через Госуслуги
						</button>
					</div>
				)}

				{method === 'google' && (
					<div className="space-y-3">
						<p className="text-sm text-gray-600">
							Вход через аккаунт Google.
						</p>
						<button
							onClick={handleGoogle}
							className="w-full flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
						>
							<span className="text-lg">G</span>
							<span>Войти через Google</span>
						</button>
					</div>
				)}
			</div>
		</div>
	);
}