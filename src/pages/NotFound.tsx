import { useLocation, Link } from 'react-router-dom';

const NotFound = () => {
	const location = useLocation();

	return (
		<div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center px-4">
			<div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-lg">
				<p className="text-sm uppercase tracking-[0.4em] text-primary/70">Поддержка++</p>
				<h1 className="mt-2 text-5xl font-bold text-slate-900">404</h1>
				<p className="mt-4 text-lg text-muted-foreground">
					Страница <span className="font-semibold">{location.pathname}</span> не найдена. Выберите действие, чтобы продолжить.
				</p>
				<div className="mt-8 flex flex-col gap-3 md:flex-row md:justify-center">
					<Link
						to="/dashboard"
						className="flex-1 rounded-2xl bg-primary px-6 py-3 text-center text-lg font-semibold text-primary-foreground shadow-md hover:bg-primary/90"
					>
						На главную
					</Link>
					<Link
						to="/assistant"
						className="flex-1 rounded-2xl border-2 border-primary px-6 py-3 text-center text-lg font-semibold text-primary hover:bg-primary/5"
					>
						Спросить ассистента
					</Link>
				</div>
			</div>
		</div>
	);
};

export default NotFound;
