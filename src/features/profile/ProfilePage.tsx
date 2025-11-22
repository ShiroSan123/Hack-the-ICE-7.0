import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/shared/ui/Layout';
import { Button } from '@/shared/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card';
import { useAppStore } from '@/shared/store/useAppStore';
import { formatSnils } from '@/shared/lib/formatters';
import { toast } from 'sonner';
import { profilesApi } from '@/shared/api/profilesApi';
import { MessageCircle, ShieldCheck, LogOut, Trash2 } from 'lucide-react';
import { supabase } from '@/shared/lib/supabaseClient';
import { useAuth } from '@/features/auth/AuthContext';

export const ProfilePage = () => {
	const { user, setUser, logout } = useAppStore();
	const { setManualUser } = useAuth();
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		name: user?.name || '',
		region: user?.region || 'xxxxxxxxx',
		category: user?.category || 'pensioner',
		snils: user?.snils || '',
		role: user?.role || 'self',
		simpleModeEnabled: user?.simpleModeEnabled ?? true,
	});

	useEffect(() => {
		if (user) {
			setFormData({
				name: user.name || '',
				region: user.region,
				category: user.category,
				snils: user.snils || '',
				role: user.role,
				simpleModeEnabled: user.simpleModeEnabled ?? true,
			});
		}
	}, [user]);

	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) return;
		setSaving(true);
		try {
			const updated = await profilesApi.updateProfile(user.id, {
				fullName: formData.name,
				region: formData.region,
				category: formData.category,
				snils: formData.snils,
				role: formData.role,
				simpleModeEnabled: formData.simpleModeEnabled,
			});
			setUser(updated);
			toast.success('Профиль успешно обновлён');
		} catch (error) {
			console.error('Profile update error', error);
			toast.error('Не получилось сохранить профиль');
		} finally {
			setSaving(false);
		}
	};

	const handleSnilsChange = (value: string) => {
		const cleaned = value.replace(/\D/g, '').slice(0, 11);
		setFormData({ ...formData, snils: cleaned });
	};

	const handleLogout = async () => {
		try {
			await supabase.auth.signOut();
		} catch (error) {
			console.error('signOut error:', error);
		} finally {
			setManualUser(null);
			logout();
			navigate('/auth');
		}
	};

	const handleDeleteProfile = async () => {
		if (!user) return;
		if (!window.confirm('Удалить профиль и выйти из аккаунта?')) {
			return;
		}
		setDeleting(true);
		try {
			await profilesApi.deleteProfile(user.id);
			await supabase.auth.signOut();
			setManualUser(null);
			logout();
			navigate('/auth', { replace: true });
			toast.success('Профиль удалён');
		} catch (error) {
			console.error('Profile delete error', error);
			toast.error('Не удалось удалить профиль');
		} finally {
			setDeleting(false);
		}
	};

	return (
		<Layout title="Профиль и настройки">
			<div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
				<Card className="rounded-3xl">
					<CardHeader>
						<CardTitle>Данные для персонализации</CardTitle>
						<CardDescription>Обновите регион, категорию и предпочтения, чтобы подсказки были точнее.</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="grid gap-4 md:grid-cols-2">
								<label className="space-y-2">
									<span className="text-sm font-semibold">Имя</span>
									<input
										type="text"
										value={formData.name}
										onChange={(e) => setFormData({ ...formData, name: e.target.value })}
										className="w-full h-12 rounded-2xl border-2 border-input bg-background px-4 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
										placeholder="Ваше имя"
									/>
								</label>

								<label className="space-y-2">
									<span className="text-sm font-semibold">Регион</span>
									<input
										type="text"
										value={formData.region}
										onChange={(e) => setFormData({ ...formData, region: e.target.value })}
										className="w-full h-12 rounded-2xl border-2 border-input bg-background px-4 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
										required
									/>
								</label>

								<label className="space-y-2">
									<span className="text-sm font-semibold">Категория льготника</span>
									<select
										value={formData.category}
										onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
										className="w-full h-12 rounded-2xl border-2 border-input bg-background px-4 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
										required
									>
										<option value="pensioner">Пенсионер</option>
										<option value="disabled">Инвалид</option>
										<option value="veteran">Ветеран</option>
										<option value="large-family">Многодетная семья</option>
										<option value="low-income">Малоимущий</option>
									</select>
								</label>

								<label className="space-y-2">
									<span className="text-sm font-semibold">СНИЛС</span>
									<input
										type="text"
										value={formatSnils(formData.snils)}
										onChange={(e) => handleSnilsChange(e.target.value)}
										className="w-full h-12 rounded-2xl border-2 border-input bg-background px-4 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
										placeholder="___-___-___ __"
										maxLength={14}
									/>
								</label>
							</div>

							<div className="grid gap-4 md:grid-cols-2">
								<label className="space-y-2">
									<span className="text-sm font-semibold">Кто использует приложение</span>
									<select
										value={formData.role}
										onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
										className="w-full h-12 rounded-2xl border-2 border-input bg-background px-4 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
										required
									>
										<option value="self">Я использую для себя</option>
										<option value="relative">Помогаю родственнику</option>
									</select>
								</label>

								<label className="space-y-2">
									<span className="text-sm font-semibold">Упрощённый режим</span>
						<div className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
							<input
								type="checkbox"
								id="simpleMode"
								checked={formData.simpleModeEnabled}
								onChange={(e) => {
									setFormData({ ...formData, simpleModeEnabled: e.target.checked });
								}}
								className="h-5 w-5 rounded border-2 border-primary"
							/>
							<label htmlFor="simpleMode" className="text-base">
								Крупные элементы, озвучка и простая навигация
							</label>
						</div>
					</label>
							</div>

						<Button type="submit" size="lg" className="w-full" disabled={saving}>
							{saving ? 'Сохраняем...' : 'Сохранить изменения'}
						</Button>
						</form>
					</CardContent>
				</Card>

				<div className="space-y-4">
					<Card className="rounded-3xl bg-secondary">
						<CardHeader>
							<CardTitle>Как работает простой режим</CardTitle>
							<CardDescription>Крупные кнопки, голосовые подсказки и быстрый доступ к печати. Можно включить по умолчанию.</CardDescription>
						</CardHeader>
					</Card>

					<Card className="rounded-3xl">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<MessageCircle className="w-5 h-5 text-primary" />Нужна помощь?
							</CardTitle>
							<CardDescription>Горячая линия 122 или наш чат-бот подскажут шаги и документы.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<Button variant="accent" size="lg" asChild className="w-full">
								<Link to="/assistant">Открыть чат-бота</Link>
							</Button>
							<div className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
								<ShieldCheck className="w-4 h-4 text-primary" />
								Персональные данные хранятся локально и используются только для рекомендаций.
							</div>
						</CardContent>
					</Card>

					<Card className="rounded-3xl space-y-4">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<LogOut className="w-5 h-5" />
								Аккаунт
							</CardTitle>
							<CardDescription>Выйдите из аккаунта и очистите локальные данные.</CardDescription>
						</CardHeader>
						<CardContent>
							<Button variant="outline" size="lg" className="w-full" onClick={handleLogout}>
								Выйти из профиля
							</Button>
						</CardContent>
						<CardContent>
							<Button
								variant="destructive"
								size="lg"
								className="w-full"
								onClick={handleDeleteProfile}
								disabled={deleting}
							>
								<Trash2 className="w-4 h-4" />
								{deleting ? 'Удаляем...' : 'Удалить профиль'}
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</Layout>
	);
};
