import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';

type Props = {
	children: React.ReactNode;
};

export const ProtectedRoute = ({ children }: Props) => {
	const { user, loading } = useAuth();

	// пока не знаем, залогинен ли пользователь – показываем лоадер
	if (loading) {
		return <div>Загрузка...</div>; // тут можно вставить нормальный спиннер
	}

	// если авторизации нет – редирект
	if (!user) {
		return <Navigate to="/auth" replace />;
	}

	// если всё ок – рендерим контент
	return <>{children}</>;
};
