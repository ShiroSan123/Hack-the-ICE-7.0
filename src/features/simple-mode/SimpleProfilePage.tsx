import { Button } from '@/shared/ui/Button';
import { useAppStore } from '@/shared/store/useAppStore';
import { useNavigate } from 'react-router-dom';
import SimpleShell from './SimpleShell';

export const SimpleProfilePage = () => {
	const { user, setSimpleMode } = useAppStore();
	const navigate = useNavigate();

	const handleFullProfile = () => {
		setSimpleMode(false);
		navigate('/profile');
	};

	return (
		<SimpleShell
			title="Профиль просто"
			description="Показываем только важное. Для редактирования переключитесь в основной режим."
		>
			<div className="rounded-3xl bg-white/90 border border-border/70 p-5 shadow-sm space-y-3 text-lg">
				<p><span className="font-semibold">Имя:</span> {user?.name || 'Не указано'}</p>
				<p><span className="font-semibold">Регион:</span> {user?.region || 'Не указан'}</p>
				<p><span className="font-semibold">Категория:</span> {user?.category || 'Не указана'}</p>
				<p><span className="font-semibold">Телефон:</span> {user?.phone || '—'}</p>
			</div>
			<div className="grid gap-3 md:grid-cols-2 mt-4">
				<Button variant="accent" size="xl" onClick={handleFullProfile} className="h-auto py-4">
					Перейти в основной режим
				</Button>
				<Button variant="outline" size="xl" onClick={() => navigate('/dashboard')} className="h-auto py-4">
					На главную
				</Button>
			</div>
		</SimpleShell>
	);
};

export default SimpleProfilePage;
