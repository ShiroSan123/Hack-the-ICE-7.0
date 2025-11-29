import { useEffect, useMemo, useState, ChangeEvent, FormEvent } from 'react';
import { Layout } from '@/shared/ui/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card';
import { medicinesApi } from '@/shared/api/medicinesApi';
import { userMedicinesApi, UserMedicinesRecord } from '@/shared/api/userMedicinesApi';
import { Medicine } from '@/shared/types';
import { useAppStore } from '@/shared/store/useAppStore';
import { MedicineCard } from './MedicineCard';
import { formatCurrency, formatDate } from '@/shared/lib/formatters';
import { Pill, TrendingDown, CalendarDays, HeartPulse, MessageCircle, Printer, RefreshCcw } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `med-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

type PersonalForm = {
  name: string;
  dosage: string;
  frequency: string;
  monthlyPrice: string;
  discountedPrice: string;
  prescribedBy: string;
  prescribedDate: string;
  refillDate: string;
};

export const AptekaPage = () => {
  const { user, medicines: personalMedsStore, setMedicines: setPersonalMedsStore } = useAppStore();
  const [catalogMeds, setCatalogMeds] = useState<Medicine[]>([]);
  const [userLinks, setUserLinks] = useState<UserMedicinesRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PersonalForm>({
    name: '',
    dosage: '',
    frequency: '',
    monthlyPrice: '',
    discountedPrice: '',
    prescribedBy: '',
    prescribedDate: '',
    refillDate: '',
  });

  const personalMeds = personalMedsStore;

  useEffect(() => {
    const bootstrap = async () => {
      if (!user?.authUserId) {
        setLoading(false);
        return;
      }
    try {
      setCatalogLoading(true);
      const [catalog, links] = await Promise.all([
        medicinesApi.getAll(),
        userMedicinesApi.getForUser(user.authUserId),
      ]);
      setCatalogMeds(catalog);
      setUserLinks(links);

      if (links.medicineIds.length) {
        const personalRemote = await medicinesApi.getByIds(links.medicineIds);
        setPersonalMedsStore(personalRemote);
      } else {
        setPersonalMedsStore([]);
      }
    } catch (error) {
      console.error('Failed to load medicines:', error);
      toast.error('Не удалось загрузить аптеку');
    } finally {
      setCatalogLoading(false);
      setLoading(false);
    }
    };

    bootstrap();
  }, [user?.authUserId]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const parseNumber = (value: string) => {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleAddMedicine = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.authUserId) {
      toast.error('Нужна авторизация, чтобы сохранить лекарство');
      return;
    }

    const name = form.name.trim();
    if (!name) {
      toast.error('Введите название лекарства');
      return;
    }

    const newId = createId();
    const personalEntry: Medicine = {
      id: newId,
      name,
      dosage: form.dosage.trim(),
      frequency: form.frequency.trim(),
      prescribedBy: form.prescribedBy.trim() || undefined,
      prescribedDate: form.prescribedDate || undefined,
      refillDate: form.refillDate || undefined,
      relatedBenefitIds: [],
      relatedOfferIds: [],
      monthlyPrice: parseNumber(form.monthlyPrice) ?? 0,
      discountedPrice: parseNumber(form.discountedPrice) ?? undefined,
    };

    setSaving(true);
    try {
      // Обновляем личный стор
      const nextPersonal = [personalEntry, ...personalMeds];
      setPersonalMedsStore(nextPersonal);

      // Сохраняем связь user -> ids
      const currentLinks = userLinks ?? { userId: user.authUserId, medicineIds: [], publicIds: [] };
      const nextLinks: UserMedicinesRecord = {
        ...currentLinks,
        medicineIds: Array.from(new Set([newId, ...currentLinks.medicineIds])),
        publicIds: Array.from(new Set([newId, ...currentLinks.publicIds])),
      };
      await userMedicinesApi.upsert(nextLinks);
      setUserLinks(nextLinks);

      // Всегда отправляем в общий пул
      await medicinesApi.create({
        id: newId,
        name: personalEntry.name,
        dosage: personalEntry.dosage,
        frequency: personalEntry.frequency,
        prescribedBy: personalEntry.prescribedBy,
        prescribedDate: personalEntry.prescribedDate ?? null,
        refillDate: personalEntry.refillDate ?? null,
        monthlyPrice: personalEntry.monthlyPrice,
        discountedPrice: personalEntry.discountedPrice ?? null,
        relatedBenefitIds: [],
        relatedOfferIds: [],
      });
      // Подтягиваем свежий каталог
      const catalog = await medicinesApi.getAll();
      setCatalogMeds(catalog);

      setForm({
        name: '',
        dosage: '',
        frequency: '',
        monthlyPrice: '',
        discountedPrice: '',
        prescribedBy: '',
        prescribedDate: '',
        refillDate: '',
      });

      toast.success('Добавлено в профиль и отправлено в общий пул');
    } catch (error) {
      console.error('Failed to add medicine:', error);
      toast.error('Не получилось сохранить. Проверьте подключение.');
    } finally {
      setSaving(false);
    }
  };

  const personalIds = useMemo(() => userLinks?.medicineIds ?? [], [userLinks]);
  const publicIds = useMemo(() => userLinks?.publicIds ?? [], [userLinks]);

  const personalFromCatalog = useMemo(() => {
    if (!personalIds.length) return [] as Medicine[];
    const map = new Map(catalogMeds.map((m) => [m.id, m] as const));
    return personalIds
      .map((id) => map.get(id))
      .filter(Boolean) as Medicine[];
  }, [catalogMeds, personalIds]);

  const matchedCatalog = useMemo(() => {
    if (!personalIds.length) return [] as Medicine[];
    const personalSet = new Set(personalIds);
    const publicSelf = new Set(publicIds);
    // Показываем только те, что в личном списке, но не помечены как ваши публичные (считаем их "админскими")
    return catalogMeds.filter((med) => personalSet.has(med.id) && !publicSelf.has(med.id));
  }, [catalogMeds, personalIds, publicIds]);

  const totalMonthlyPrice = personalFromCatalog.reduce((sum, med) => sum + med.monthlyPrice, 0);
  const totalDiscountedPrice = personalFromCatalog.reduce(
    (sum, med) => sum + (med.discountedPrice ?? med.monthlyPrice),
    0
  );
  const monthlySavings = Math.max(totalMonthlyPrice - totalDiscountedPrice, 0);
  const nextRefill = personalFromCatalog
    .filter((med) => med.refillDate)
    .sort((a, b) => (a.refillDate || '').localeCompare(b.refillDate || ''))[0]?.refillDate;
  const freeMeds = personalFromCatalog.filter((med) => med.discountedPrice === 0).length;

  if (loading) {
    return (
      <Layout title="Моя аптечка">
        <div className="text-center py-12">
          <p className="text-xl">Загружаем аптечку...</p>
        </div>
      </Layout>
    );
  }

  if (!user?.authUserId) {
    return (
      <Layout title="Моя аптечка">
        <div className="text-center py-12">
          <p className="text-xl">Нужна авторизация, чтобы работать с аптечкой.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Аптека: лекарства и скидки">
      <div className="space-y-8">
        <section className="grid gap-4 lg:grid-cols-4">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-6 h-6 text-primary" />
                Всего моих лекарств
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{personalFromCatalog.length}</p>
              <p className="text-sm text-muted-foreground">{freeMeds} доступны бесплатно</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Мои траты в месяц</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-through">
                {formatCurrency(totalMonthlyPrice)}
              </p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(totalDiscountedPrice)}</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <TrendingDown className="w-6 h-6" />
                Экономия в месяц
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{formatCurrency(monthlySavings)}</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-6 h-6 text-primary" />
                Ближайшая покупка
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {nextRefill ? formatDate(nextRefill) : 'Пока нет запланированных дат'}
              </p>
              <p className="text-sm text-muted-foreground">
                Напоминание по датам пополнения аптечки.
              </p>
            </CardContent>
          </Card>
        </section>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Мои лекарства</h2>
            {personalFromCatalog.map((medicine) => (
              <MedicineCard key={medicine.id} medicine={medicine} />
            ))}

            {personalFromCatalog.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Pill className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-xl text-muted-foreground">
                    Пока пусто. Добавьте первое лекарство справа.
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCcw className="w-5 h-5 text-primary" />
                  Совпадения в общей базе
                </CardTitle>
                <CardDescription>
                  Показываем только те записи из Supabase, что привязаны к вашему профилю.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await loadCatalog();
                      toast.success('Каталог обновлен');
                    }}
                    disabled={catalogLoading}
                  >
                    {catalogLoading ? 'Обновляем...' : 'Обновить базу'}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Найдено совпадений: {matchedCatalog.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {matchedCatalog.map((med) => (
                    <div
                      key={med.id}
                      className="rounded-2xl border border-border/60 bg-secondary/40 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{med.name}</p>
                        <p className="text-primary font-bold">
                          {formatCurrency(med.discountedPrice ?? med.monthlyPrice)}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {med.dosage} · {med.frequency}
                      </p>
                      {med.refillDate && (
                        <p className="text-xs text-muted-foreground">
                          Покупка до {formatDate(med.refillDate)}
                        </p>
                      )}
                      {publicIds.includes(med.id) && (
                        <p className="text-xs text-emerald-600 font-semibold">В общем пуле</p>
                      )}
                    </div>
                  ))}

                  {matchedCatalog.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Пока нет совпадений. Добавьте или обновите каталог.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card className="rounded-3xl border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="w-6 h-6 text-primary" />
                  Добавить лекарство
                </CardTitle>
                <CardDescription>
                  Сохраняем в ваш профиль; по желанию публикуем в общий пул (Supabase).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={handleAddMedicine}>
                  <div className="space-y-1">
                    <Label htmlFor="name">Название *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Например, Нурофен"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="dosage">Дозировка</Label>
                      <Input
                        id="dosage"
                        name="dosage"
                        placeholder="200 мг"
                        value={form.dosage}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="frequency">Как принимать</Label>
                      <Input
                        id="frequency"
                        name="frequency"
                        placeholder="2 раза в день"
                        value={form.frequency}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="monthlyPrice">Цена в месяц, ₽</Label>
                      <Input
                        id="monthlyPrice"
                        name="monthlyPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={form.monthlyPrice}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="discountedPrice">Со скидкой, ₽</Label>
                      <Input
                        id="discountedPrice"
                        name="discountedPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="если есть"
                        value={form.discountedPrice}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="prescribedBy">Кто назначил</Label>
                      <Input
                        id="prescribedBy"
                        name="prescribedBy"
                        placeholder="Врач, клиника"
                        value={form.prescribedBy}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="prescribedDate">Назначено</Label>
                      <Input
                        id="prescribedDate"
                        name="prescribedDate"
                        type="date"
                        value={form.prescribedDate}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="refillDate">Следующая покупка</Label>
                    <Input
                      id="refillDate"
                      name="refillDate"
                      type="date"
                      value={form.refillDate}
                      onChange={handleChange}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? 'Сохраняем...' : 'Добавить в аптечку'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Личный список хранится в профиле; общий пул — для сопоставления. В выдаче отображаются только админские записи.
                  </p>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-3xl bg-secondary">
              <CardHeader>
                <CardTitle>Контакты поддержки</CardTitle>
                <CardDescription>
                  Позвоните, если нужно добавить лекарство или уточнить льготы: <strong>xxxxxxxxx</strong>.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HeartPulse className="w-6 h-6 text-primary" />
                  Нужна помощь?
                </CardTitle>
                <CardDescription>Быстрая связь с ассистентом и печать списка лекарств.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="lg" asChild className="w-full">
                  <Link to="/assistant">
                    <MessageCircle className="w-5 h-5" />
                    Написать ассистенту
                  </Link>
                </Button>
                <Button variant="accent" size="lg" asChild className="w-full">
                  <Link to="/print">
                    <Printer className="w-5 h-5" />
                    Печать списка
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </Layout>
  );
};
