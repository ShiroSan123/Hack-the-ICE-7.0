import { useState, useEffect } from 'react';
import { Layout } from '@/shared/ui/Layout';
import { Button } from '@/shared/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card';
import { useAppStore } from '@/shared/store/useAppStore';
import { formatSnils } from '@/shared/lib/formatters';
import { toast } from 'sonner';

export const ProfilePage = () => {
	const { user, setUser, setSimpleMode } = useAppStore();
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

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) return;

		setUser({
			...user,
			...formData,
		});

		toast.success('Профиль успешно обновлён');
	};

	const handleSnilsChange = (value: string) => {
		const cleaned = value.replace(/\D/g, '').slice(0, 11);
		setFormData({ ...formData, snils: cleaned });
	};

	return (
		<Layout title="Профиль">
			<div className="max-w-2xl mx-auto">
				<Card>
					<CardHeader>
						<CardTitle>Личные данные</CardTitle>
						<CardDescription>
							Укажите ваши данные для персонализации льгот
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-6">
							<div>
								<label className="block text-base font-medium mb-2">
									Имя
								</label>
								<input
									type="text"
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									className="w-full h-12 px-4 text-base rounded-lg border-2 border-input bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
									placeholder="Ваше имя"
								/>
							</div>

							<div>
								<label className="block text-base font-medium mb-2">
									Регион
								</label>
								<input
									type="text"
									value={formData.region}
									onChange={(e) => setFormData({ ...formData, region: e.target.value })}
									className="w-full h-12 px-4 text-base rounded-lg border-2 border-input bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
									required
								/>
							</div>

							<div>
								<label className="block text-base font-medium mb-2">
									Категория льготника
								</label>
								<select
									value={formData.category}
									onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
									className="w-full h-12 px-4 text-base rounded-lg border-2 border-input bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
									required
								>
									<option value="pensioner">Пенсионер</option>
									<option value="disabled">Инвалид</option>
									<option value="veteran">Ветеран</option>
									<option value="large-family">Многодетная семья</option>
									<option value="low-income">Малоимущий</option>
								</select>
							</div>

							<div>
								<label className="block text-base font-medium mb-2">
									СНИЛС
								</label>
								<input
									type="text"
									value={formatSnils(formData.snils)}
									onChange={(e) => handleSnilsChange(e.target.value)}
									className="w-full h-12 px-4 text-base rounded-lg border-2 border-input bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
									placeholder="___-___-___ __"
									maxLength={14}
								/>
							</div>

							<div>
								<label className="block text-base font-medium mb-2">
									Кто использует приложение
								</label>
								<select
									value={formData.role}
									onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
									className="w-full h-12 px-4 text-base rounded-lg border-2 border-input bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
									required
								>
									<option value="self">Я использую для себя</option>
									<option value="relative">Помогаю родственнику</option>
								</select>
							</div>

							<div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
								<input
									type="checkbox"
									id="simpleMode"
									checked={formData.simpleModeEnabled}
									onChange={(e) => {
										setFormData({ ...formData, simpleModeEnabled: e.target.checked });
										setSimpleMode(e.target.checked);
									}}
									className="w-6 h-6 rounded border-2 border-primary"
								/>
								<label htmlFor="simpleMode" className="text-base font-medium cursor-pointer">
									Упрощённый режим (крупные кнопки, озвучка)
								</label>
							</div>

							<Button type="submit" size="lg" className="w-full">
								Сохранить изменения
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</Layout>
	);
};
