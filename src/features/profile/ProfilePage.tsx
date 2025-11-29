import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/shared/ui/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAppStore } from '@/shared/store/useAppStore';
import { profilesApi } from '@/shared/api/profilesApi';
import { useAuth } from '@/features/auth/AuthContext';
import { supabase } from '@/shared/lib/supabaseClient';
import { UserProfile } from '@/shared/types';
import { toast } from 'sonner';

const CATEGORY_OPTIONS: { value: UserProfile['category']; label: string }[] = [
  { value: 'pensioner', label: 'Пенсионер' },
  { value: 'disabled', label: 'Инвалидность' },
  { value: 'veteran', label: 'Ветеран' },
  { value: 'large-family', label: 'Многодетная семья' },
  { value: 'low-income', label: 'Малообеспеченный' },
  { value: 'russia', label: 'Общий' },
];

const INTEREST_OPTIONS: { value: string; label: string }[] = [
  { value: 'payments', label: 'Выплаты' },
  { value: 'medicine', label: 'Лекарства' },
  { value: 'transport', label: 'Транспорт' },
  { value: 'care', label: 'Уход' },
];

const REGION_OPTIONS = ['yakutsk', 'sakha_republic', 'moscow', 'russia'];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAppStore();
  const { setManualUser } = useAuth();

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    region: user?.region ?? 'xxxxxxxxx',
    category: user?.category ?? 'pensioner',
    snils: user?.snils ?? '',
    simpleModeEnabled: user?.simpleModeEnabled ?? true,
    interests: user?.interests ?? [],
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? '',
        phone: user.phone ?? '',
        email: user.email ?? '',
        region: user.region ?? 'xxxxxxxxx',
        category: user.category ?? 'pensioner',
        snils: user.snils ?? '',
        simpleModeEnabled: user.simpleModeEnabled ?? true,
        interests: user.interests ?? [],
      });
    }
  }, [user]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSnilsChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    setForm((prev) => ({ ...prev, snils: cleaned }));
  };

  const toggleInterest = (value: string) => {
    setForm((prev) => {
      const has = prev.interests.includes(value);
      return {
        ...prev,
        interests: has ? prev.interests.filter((i) => i !== value) : [...prev.interests, value],
      };
    });
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);

    const normalizedPhone = form.phone.trim() || null;
    const normalizedEmail = form.email.trim() || null;

    const isRealUser = UUID_REGEX.test(user.authUserId);

    if (!isRealUser) {
      const updatedLocal: UserProfile = {
        ...user,
        name: form.name || undefined,
        phone: normalizedPhone || undefined,
        email: normalizedEmail || undefined,
        region: form.region,
        category: form.category,
        snils: form.snils || undefined,
        interests: form.interests,
        simpleModeEnabled: form.simpleModeEnabled,
      };
      setUser(updatedLocal);
      toast.success('Профиль сохранён локально');
      setSaving(false);
      return;
    }

    try {
      const updated = await profilesApi.updateProfile(user.authUserId, {
        fullName: form.name,
        phone: normalizedPhone,
        email: normalizedEmail,
        region: form.region,
        category: form.category,
        snils: form.snils || null,
        interests: form.interests,
        simpleModeEnabled: form.simpleModeEnabled,
      });
      setUser(updated);
      toast.success('Профиль обновлён');
    } catch (error) {
      console.error('Profile update error', error);
      toast.error('Не удалось сохранить профиль');
    } finally {
      setSaving(false);
    }
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

  const handleDelete = async () => {
    if (!user) return;
    if (!window.confirm('Точно удалить профиль и выйти?')) return;
    setDeleting(true);
    try {
      if (UUID_REGEX.test(user.authUserId)) {
        await profilesApi.deleteProfile(user.authUserId);
      }
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
    <Layout title="Профиль">
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle>Быстрые данные</CardTitle>
            <CardDescription>Главные поля, чтобы мы могли подобрать льготы и скидки.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSave}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="name">ФИО</Label>
                  <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Иван Иванов" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="snils">СНИЛС</Label>
                  <Input
                    id="snils"
                    name="snils"
                    value={form.snils}
                    onChange={(e) => handleSnilsChange(e.target.value)}
                    placeholder="00000000000"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+7..." />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" value={form.email} onChange={handleChange} placeholder="you@email.com" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="region">Регион</Label>
                  <Input
                    id="region"
                    name="region"
                    value={form.region}
                    onChange={handleChange}
                    list="region-suggestions"
                    placeholder="Например, yakutsk"
                  />
                  <datalist id="region-suggestions">
                    {REGION_OPTIONS.map((region) => (
                      <option key={region} value={region} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="category">Категория</Label>
                  <select
                    id="category"
                    name="category"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.category}
                    onChange={handleChange}
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Интересы</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {INTEREST_OPTIONS.map((option) => {
                    const checked = form.interests.includes(option.value);
                    return (
                      <label key={option.value} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleInterest(option.value)}
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                <div>
                  <p className="font-semibold">Простой режим</p>
                  <p className="text-sm text-muted-foreground">Оставить только нужное, меньше разделов.</p>
                </div>
                <Switch checked={form.simpleModeEnabled} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, simpleModeEnabled: checked }))} />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Сохраняем...' : 'Сохранить профиль'}
                </Button>
                <Button type="button" variant="outline" onClick={handleLogout}>
                  Выйти
                </Button>
                <Button type="button" variant="ghost" className="text-destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Удаляем...' : 'Удалить профиль'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-3xl border-dashed">
            <CardHeader>
              <CardTitle>Статус профиля</CardTitle>
              <CardDescription>Главные поля заполнены: {form.name ? 'да' : 'нет'}, контакты: {form.phone || form.email ? 'да' : 'нет'}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Категория: {CATEGORY_OPTIONS.find((c) => c.value === form.category)?.label || '—'}</p>
              <p>Регион: {form.region || '—'}</p>
              <p>Интересы: {form.interests.length ? form.interests.length : 'нет'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
