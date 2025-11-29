import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { Button } from '@/shared/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card';
import { cn } from '@/lib/utils';
import { AlertCircle, Camera, CheckCircle2, FileUp, QrCode, StopCircle } from 'lucide-react';

type ScanStatus = 'idle' | 'scanning';

type QrProfileSnapshot = {
	fullName?: string | null;
	region?: string | null;
	category?: string | null;
	age?: number | null;
	birthYear?: number | null;
};

type QrCareSummary = {
	benefitsCount?: number;
	medicinesCount?: number;
	benefits?: { title?: string | null; type?: string | null; expiresIn?: number | null }[];
	medicines?: { name?: string | null; dosage?: string | null; frequency?: string | null }[];
};

type QrPayload = {
	requestId?: string;
	phone?: string;
	provider?: string;
	brand?: string;
	generatedAt?: string;
	profile?: QrProfileSnapshot;
	care?: QrCareSummary;
};

const formatDate = (value?: string) => {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '—';
	return date.toLocaleString('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
};

const QrSupportScanner = () => {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const controlsRef = useRef<IScannerControls | null>(null);
	const scanner = useMemo(() => new BrowserMultiFormatReader(), []);

	const [status, setStatus] = useState<ScanStatus>('idle');
	const [hint, setHint] = useState(
		'Наведите камеру или загрузите фото QR-кода с памятки печати.'
	);
	const [rawResult, setRawResult] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const parsedPayload = useMemo<QrPayload | null>(() => {
		if (!rawResult) return null;
		try {
			const parsed = JSON.parse(rawResult);
			return typeof parsed === 'object' && parsed !== null ? (parsed as QrPayload) : null;
		} catch {
			return null;
		}
	}, [rawResult]);

	const stopCamera = () => {
		controlsRef.current?.stop();
		controlsRef.current = null;
		BrowserMultiFormatReader.releaseAllStreams();

		const stream = videoRef.current?.srcObject;
		if (stream && stream instanceof MediaStream) {
			stream.getTracks().forEach((track) => track.stop());
			if (videoRef.current) {
				videoRef.current.srcObject = null;
			}
		}

		setStatus('idle');
	};

	const startCamera = async () => {
		if (!videoRef.current) {
			setError('Видеоэлемент не готов. Обновите страницу и попробуйте снова.');
			return;
		}

		if (!navigator.mediaDevices?.getUserMedia) {
			setError('Браузер не поддерживает работу с камерой. Откройте в мобильном Chrome/Safari.');
			return;
		}

		stopCamera();
		setStatus('scanning');
		setRawResult(null);
		setError(null);
		setHint('Ищем камеру и наводим на QR-код...');

		try {
			const constraints: MediaStreamConstraints = {
				video: {
					facingMode: { ideal: 'environment' },
					width: { ideal: 1280 },
					height: { ideal: 720 },
				},
				audio: false,
			};

			// Явно запрашиваем доступ: на iOS список устройств пуст без этого
			const stream =
				(await navigator.mediaDevices
					.getUserMedia(constraints)
					.catch(() => navigator.mediaDevices.getUserMedia({ video: true, audio: false }))) || null;

			const handleResult = (result: any, decodeError: any, ctrl?: IScannerControls | null) => {
				if (result) {
					setRawResult(result.getText());
					setHint('QR-код считан. Можно остановить камеру.');
					setStatus('idle');
					ctrl?.stop();
					controlsRef.current = null;
					return;
				}

				if (decodeError && !(decodeError instanceof NotFoundException)) {
					setError('Не удалось расшифровать QR. Попробуйте поднести камеру ближе.');
				}
			};

			let controls: IScannerControls | undefined | null;

			if (stream && videoRef.current) {
				// Важно для Safari: playsInline и прямое назначение stream
				videoRef.current.srcObject = stream;
				videoRef.current.setAttribute('playsinline', 'true');
				videoRef.current.setAttribute('muted', 'true');
				await videoRef.current.play().catch(() => undefined);
				controls = await scanner.decodeFromStream(stream, videoRef.current, handleResult);
			} else {
				const devices = await BrowserMultiFormatReader.listVideoInputDevices();
				const preferred = devices.find((device) => {
					const label = (device.label || '').toLowerCase();
					return label.includes('back') || label.includes('rear');
				});
				const deviceId = (preferred ?? devices[0])?.deviceId;

				if (deviceId) {
					controls = await scanner.decodeFromVideoDevice(deviceId, videoRef.current, handleResult);
				} else {
					// Без stream и списка устройств — просим любой доступный видеоинпут
					controls = await scanner.decodeFromConstraints({ video: true, audio: false }, videoRef.current, handleResult);
				}
			}

			if (!controls) {
				throw new Error('Не удалось запустить видеопоток. Разрешите доступ к камере.');
			}

			controlsRef.current = controls;
			setHint('Держите памятку ровно, камера ищет QR...');
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: 'Не получилось запустить камеру. Проверьте разрешения и попробуйте снова.';
			setError(message);
			setStatus('idle');
			setHint('Попробуйте снова или загрузите фото QR-кода.');
		}
	};

	const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setStatus('scanning');
		setRawResult(null);
		setError(null);
		setHint('Читаем QR на изображении...');

		const url = URL.createObjectURL(file);

		try {
			const output = await scanner.decodeFromImageUrl(url);
			setRawResult(output.getText());
			setHint('QR-код считан из файла.');
		} catch {
			setError('Не получилось найти QR на изображении. Попробуйте другое фото.');
			setHint('Попробуйте снова сфотографировать QR крупно и без бликов.');
		} finally {
			setStatus('idle');
			URL.revokeObjectURL(url);
			event.target.value = '';
		}
	};

	useEffect(() => {
		return () => stopCamera();
	}, []);

	const statusDotClass = cn(
		'inline-block h-2.5 w-2.5 rounded-full',
		status === 'scanning' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
	);

	return (
		<Card className="h-full">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<QrCode className="w-6 h-6 text-primary" />
					Сканер QR из памятки поддержки
				</CardTitle>
				<CardDescription>
					Считайте QR-код с распечатанной памятки, чтобы быстро получить requestId, телефон и
					снимок профиля для службы поддержки.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-wrap gap-3">
					<Button variant="accent" size="sm" onClick={startCamera} disabled={status === 'scanning'}>
						<Camera className="w-4 h-4" />
						{status === 'scanning' ? 'Сканируем...' : 'Запустить камеру'}
					</Button>
					<Button variant="outline" size="sm" onClick={stopCamera} disabled={status === 'idle'}>
						<StopCircle className="w-4 h-4" />
						Остановить
					</Button>
					<Button variant="ghost" size="sm" asChild>
						<label className="cursor-pointer inline-flex items-center gap-2">
							<FileUp className="w-4 h-4" />
							Загрузить фото
							<input
								type="file"
								accept="image/*"
								onChange={handleUpload}
								className="sr-only"
							/>
						</label>
					</Button>
				</div>

				<div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
					<span className={statusDotClass} aria-hidden />
					<span>{hint}</span>
				</div>

				{status === 'scanning' && (
					<div className="overflow-hidden rounded-2xl border border-primary/30 bg-black/70">
						<video
							ref={videoRef}
							className="block h-56 w-full object-cover"
							muted
							autoPlay
							playsInline
						/>
					</div>
				)}

				{error && (
					<div className="flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
						<AlertCircle className="w-4 h-4 mt-0.5" />
						<span>{error}</span>
					</div>
				)}

				{parsedPayload && (
					<div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="rounded-xl border border-border/60 bg-white px-3 py-2">
								<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Request ID</p>
								<p className="font-mono text-sm break-all">{parsedPayload.requestId ?? '—'}</p>
							</div>
							<div className="rounded-xl border border-border/60 bg-white px-3 py-2">
								<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Телефон</p>
								<p className="text-sm font-semibold">{parsedPayload.phone ?? '—'}</p>
							</div>
							<div className="rounded-xl border border-border/60 bg-white px-3 py-2">
								<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Провайдер</p>
								<p className="text-sm font-semibold">
									{parsedPayload.provider ?? '—'} {parsedPayload.brand ? `(${parsedPayload.brand})` : ''}
								</p>
							</div>
							<div className="rounded-xl border border-border/60 bg-white px-3 py-2">
								<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Сгенерирован</p>
								<p className="text-sm font-semibold">{formatDate(parsedPayload.generatedAt)}</p>
							</div>
						</div>

						{parsedPayload.profile && (
							<div className="rounded-xl border border-border/60 bg-white px-3 py-3 space-y-1">
								<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Профиль</p>
								<p className="font-semibold">{parsedPayload.profile.fullName || '—'}</p>
								<p className="text-sm text-muted-foreground">
									{parsedPayload.profile.region || 'Регион не указан'} ·{' '}
									{parsedPayload.profile.category || 'Категория не указана'}
								</p>
								{(parsedPayload.profile.age || parsedPayload.profile.birthYear) && (
									<p className="text-sm text-muted-foreground">
										{parsedPayload.profile.age ? `${parsedPayload.profile.age} лет` : null}
										{parsedPayload.profile.age && parsedPayload.profile.birthYear ? ' · ' : ''}
										{parsedPayload.profile.birthYear ? `Год рождения: ${parsedPayload.profile.birthYear}` : ''}
									</p>
								)}
							</div>
						)}

						{parsedPayload.care && (
							<div className="rounded-xl border border-border/60 bg-white px-3 py-3 space-y-3">
								<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Забота</p>
								<div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
									{typeof parsedPayload.care.benefitsCount === 'number' && (
										<span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">
											<CheckCircle2 className="w-4 h-4" />
											Льгот: {parsedPayload.care.benefitsCount}
										</span>
									)}
									{typeof parsedPayload.care.medicinesCount === 'number' && (
										<span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 font-semibold text-accent-foreground">
											<CheckCircle2 className="w-4 h-4" />
											Препаратов: {parsedPayload.care.medicinesCount}
										</span>
									)}
								</div>

								{parsedPayload.care.benefits?.length ? (
									<div className="space-y-2">
										<p className="text-sm font-semibold text-foreground">Льготы</p>
										<ul className="space-y-1 text-sm text-muted-foreground">
											{parsedPayload.care.benefits.slice(0, 4).map((benefit, index) => (
												<li key={`${benefit?.title ?? 'benefit'}-${index}`} className="flex items-start gap-2">
													<CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
													<span>
														{benefit?.title || 'Без названия'}
														{benefit?.type ? ` · ${benefit.type}` : ''}
														{typeof benefit?.expiresIn === 'number'
															? ` · истекает через ${benefit.expiresIn} дн.`
															: ''}
													</span>
												</li>
											))}
										</ul>
									</div>
								) : null}

								{parsedPayload.care.medicines?.length ? (
									<div className="space-y-2">
										<p className="text-sm font-semibold text-foreground">Препараты</p>
										<ul className="space-y-1 text-sm text-muted-foreground">
											{parsedPayload.care.medicines.slice(0, 4).map((medicine, index) => (
												<li key={`${medicine?.name ?? 'medicine'}-${index}`} className="flex items-start gap-2">
													<CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
													<span>
														{medicine?.name || 'Без названия'}
														{medicine?.dosage ? ` · ${medicine.dosage}` : ''}
														{medicine?.frequency ? ` · ${medicine.frequency}` : ''}
													</span>
												</li>
											))}
										</ul>
									</div>
								) : null}
							</div>
						)}
					</div>
				)}

				{rawResult && !parsedPayload && (
					<div className="rounded-2xl border border-border/70 bg-slate-50 p-4">
						<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">Текст QR</p>
						<pre className="max-h-60 overflow-auto text-xs font-mono leading-5 text-slate-700 whitespace-pre-wrap break-words">
							{rawResult}
						</pre>
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default QrSupportScanner;
